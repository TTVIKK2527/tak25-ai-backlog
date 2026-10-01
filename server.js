import http from "node:http";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { requestAI } from "./ai.js";
import { splitConnextra, validateCriterion, readiness } from './public/domain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (existsSync(path.join(__dirname, '.env'))) process.loadEnvFile(path.join(__dirname, '.env'));
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "projects.json");
const PUBLIC_DIR = path.join(__dirname, "public");

const stages = ["Idee", "Rollid", "Lood", "Prioriteedid", "Kriteeriumid ja mockup", "Täpsustused", "Groomimine"];

async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DB_FILE)) await writeFile(DB_FILE, JSON.stringify({ projects: [] }, null, 2));
}

async function readDb() {
  await ensureDb();
  return JSON.parse(await readFile(DB_FILE, "utf8"));
}

async function writeDb(db) {
  const temporary = `${DB_FILE}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(db, null, 2));
  await rename(temporary, DB_FILE);
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function json(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function now() {
  return new Date().toISOString();
}

function snapshot(project) {
  project.undoStack ||= [];
  project.undoStack.push({
    backlog: structuredClone(project.backlog || []),
    conversations: structuredClone(project.conversations || []),
    currentStage: project.currentStage,
    selectedStoryId: project.selectedStoryId || null,
    pendingProposal: structuredClone(project.pendingProposal || null),
    mvpAfterOrder: project.mvpAfterOrder,
    roles: structuredClone(project.roles || []),
    description: project.description,
    questionCount: project.questionCount || 0
  });
  if (project.undoStack.length > 20) project.undoStack.shift();
}

function addConversation(project, speaker, text, actions = [], proposal = null) {
  project.conversations ||= [];
  project.conversations.push({ id: id("msg"), at: now(), speaker, text, actions, proposal });
}

function story(title, order, size = "M", status = "Idee", origin = "AI ettepanek") {
  const parts = splitConnextra(title);
  return {
    id: id("story"),
    title,
    ...parts,
    criteria: [],
    status,
    order,
    size,
    mockups: [],
    openQuestions: [],
    origin,
    selected: true
  };
}

function criterion(text, mockupElementId) {
  return { id: id("ac"), text, accepted: true, mockupElementId, valid: validateCriterion(text) };
}

function materialize(draft, order, existing = null) {
  const result = { ...(existing || story(draft.title, order)), ...splitConnextra(draft.title), title: draft.title, size: draft.size, order, status: existing?.status === 'Vajab täpsustamist' ? 'Vajab täpsustamist' : draft.criteria.length ? 'Läbivaadatud' : 'Idee', openQuestions: draft.openQuestions, criteria: draft.criteria.map(ac => criterion(ac.text, ac.mockupElementId)) };
  const versions = existing?.mockups || [];
  result.mockups = [...versions, ...(draft.components.length ? [{ id: id('mock'), version: Math.max(0, ...versions.map(m => m.version)) + 1, title: draft.mockupTitle, components: draft.components, criteria: structuredClone(result.criteria) }] : [])];
  return result;
}

async function findProject(db, projectId) {
  const project = db.projects.find((item) => item.id === projectId);
  if (!project) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }
  return project;
}

async function api(req, res, pathname) {
  if (pathname === '/api/ai-status') return json(res, 200, { configured: Boolean(process.env.GROQ_API_KEY), provider: 'Groq', model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b' });
  const db = await readDb();
  if (req.method === "GET" && pathname === "/api/projects") {
    return json(res, 200, db.projects.map(({ undoStack, ...project }) => project));
  }
  if (req.method === "POST" && pathname === "/api/projects") {
    const input = await body(req);
    const project = {
      id: id("project"),
      name: input.name?.trim() || "Uus projekt",
      description: input.description?.trim() || "",
      createdAt: now(),
      updatedAt: now(),
      currentStage: "Idee",
      roles: [],
      backlog: [],
      conversations: [],
      selectedStoryId: null,
      mvpAfterOrder: 4,
      undoStack: []
    };
    addConversation(project, "ai", "Alustame ühest ideest. Kirjelda kliendi vajadust ühe või paari lausega.", ["Sisesta idee"]);
    db.projects.unshift(project);
    await writeDb(db);
    return json(res, 201, project);
  }
  const match = pathname.match(/^\/api\/projects\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return json(res, 404, { error: "Not found" });
  const project = await findProject(db, match[1]);
  const action = match[2];

  const aiTasks = { idea: 'idea', answer: 'answer', regenerate: 'regenerate', priority: 'priority', 'generate-design': 'design', clarify: 'clarify', review: 'review', 'new-view': 'new-view', chat: 'answer' };
  if (req.method === 'POST' && aiTasks[action]) {
    const input = await body(req);
    const context = structuredClone(project);
    if (action === 'idea') { context.description = input.idea || project.description; context.questionCount = 0; }
    if (action === 'answer' && input.key === 'roles') context.roles = [...(input.values || []).filter(v => v !== 'Jäta vahele'), ...(input.text ? [input.text] : [])];
    const selected = project.backlog.find(s => s.id === project.selectedStoryId);
    if (['generate-design', 'clarify'].includes(action) && !selected) return json(res, 400, { error: 'Vali enne lugu.' });
    const result = await requestAI(aiTasks[action], context, input);
    snapshot(project);
    if (action === 'idea') project.description = context.description;
    if (action === 'answer' && input.key === 'roles') project.roles = context.roles;
    const userText = input.idea || input.text || (input.values || []).join(', ');
    if (userText) addConversation(project, 'user', userText);
    let proposal;
    if (result.kind === 'question') {
      project.questionCount = (context.questionCount || 0) + 1;
      project.currentStage = 'Rollid';
      proposal = { type: 'question', key: action === 'idea' ? 'roles' : `question_${id('q')}`, multi: result.multi, choices: result.choices };
    } else if (result.kind === 'stories') {
      project.currentStage = 'Lood';
      proposal = { type: 'story-proposal', stories: result.stories.map((draft, i) => materialize(draft, i + 1)), nextActions: result.choices };
    } else if (result.kind === 'priority') {
      project.currentStage = 'Prioriteedid';
      proposal = { type: 'priority', recommendedStoryId: result.recommendedStoryId };
    } else if (['design', 'clarification'].includes(result.kind)) {
      const after = materialize(result.stories[0], action === 'new-view' ? project.backlog.length + 1 : selected.order, action === 'new-view' ? null : selected);
      if (action === 'new-view') {
        proposal = { type: 'new-view', after };
      } else if (result.kind === 'design') {
        proposal = { type: 'criteria-mockup', storyId: selected.id, criteria: after.criteria, mockup: after.mockups.at(-1), after, before: structuredClone(selected) };
      } else {
        proposal = { type: 'clarification', storyId: selected.id, before: structuredClone(selected), after, impact: 'Muudatus puudutab ainult valitud lugu.' };
      }
      project.pendingProposal = proposal;
      project.currentStage = result.kind === 'design' ? 'Kriteeriumid ja mockup' : 'Täpsustused';
    } else if (result.kind === 'grooming') {
      project.currentStage = 'Groomimine';
      proposal = { type: 'grooming', findings: result.findings.map(f => {
        const before = f.storyIds.map(target => structuredClone(project.backlog.find(s => s.id === target)));
        const history = before.flatMap(s => s.mockups);
        return { ...f, id: id('finding'), proposal: f.replacements.map(s => s.title).join(' / '), before, replacements: f.replacements.map((draft, i) => ({ ...materialize(draft, i + 1, { ...before[0], mockups: history }), id: id('story'), origin: 'AI ettepanek' })) };
      }) };
    }
    addConversation(project, 'ai', result.message, result.choices, proposal);
    project.updatedAt = now();
    await writeDb(db);
    return json(res, 200, project);
  }

  if (req.method === 'POST' && action === 'stage') {
    const input = await body(req);
    if (!stages.includes(input.stage)) return json(res, 400, { error: 'Tundmatu etapp.' });
    project.currentStage = input.stage;
    await writeDb(db);
    return json(res, 200, project);
  }
  if (req.method === 'POST' && action === 'edit-proposed-story') {
    const input = await body(req);
    const proposal = [...project.conversations].reverse().find(msg => msg.proposal?.type === 'story-proposal')?.proposal;
    const target = proposal?.stories.find(s => s.id === input.storyId);
    if (!target || typeof input.title !== 'string') return json(res, 400, { error: 'Ettepanekut ei leitud.' });
    target.title = input.title.trim(); Object.assign(target, splitConnextra(target.title));
    await writeDb(db);
    return json(res, 200, project);
  }
  if (req.method === 'POST' && action === 'restore-mockup') {
    const input = await body(req);
    const target = project.backlog.find(s => s.id === input.storyId);
    const version = target?.mockups.find(m => m.id === input.mockupId);
    if (!version) return json(res, 404, { error: 'Versiooni ei leitud.' });
    snapshot(project);
    const restored = { ...structuredClone(version), id: id('mock'), version: Math.max(...target.mockups.map(m => m.version)) + 1 };
    if (version.criteria) target.criteria = structuredClone(version.criteria);
    target.mockups.push(restored);
    target.status = 'Läbivaadatud';
    await writeDb(db);
    return json(res, 200, project);
  }
  if (req.method === 'POST' && action === 'discard-proposal') {
    snapshot(project);
    delete project.pendingProposal;
    addConversation(project, 'ai', 'Ettepanekust loobutud. Vali järgmine samm.', ['Koosta kriteeriumid ja mockup', "Vaatame backlog'i üle"]);
    await writeDb(db);
    return json(res, 200, project);
  }
  if (req.method === 'POST' && action === 'ignore-finding') {
    const input = await body(req);
    const finding = project.conversations.flatMap(msg => msg.proposal?.findings || []).find(f => f.id === input.id);
    if (finding) finding.ignored = true;
    await writeDb(db);
    return json(res, 200, project);
  }
  if (req.method === 'POST' && action === 'manual-groom') {
    const input = await body(req);
    const targets = project.backlog.filter(s => (input.storyIds || []).includes(s.id));
    if (!targets.length || !['split', 'merge'].includes(input.type)) return json(res, 400, { error: 'Vali lood.' });
    let replacements;
    if (input.type === 'split') {
      if (!Array.isArray(input.titles) || input.titles.length !== 2 || input.titles.some(t => !splitConnextra(t).role)) return json(res, 400, { error: 'Sisesta kaks Connextra pealkirja.' });
      const source = targets[0];
      const midpoint = Math.ceil(source.criteria.length / 2);
      replacements = input.titles.map((title, i) => ({ ...structuredClone(source), ...story(title, i + 1, 'S', 'Vajab täpsustamist', 'käsitsi lisatud'), criteria: structuredClone(i ? source.criteria.slice(midpoint) : source.criteria.slice(0, midpoint)), mockups: structuredClone(source.mockups), openQuestions: ['Kontrolli jagatud loo ulatust ja mockup’i.'] }));
    } else {
      if (targets.length < 2) return json(res, 400, { error: 'Vali vähemalt kaks lugu.' });
      const title = input.title || targets[0].title;
      replacements = [{ ...structuredClone(targets[0]), ...story(title, 1, 'L', 'Vajab täpsustamist', 'käsitsi lisatud'), criteria: [...new Map(targets.flatMap(s => s.criteria).map(ac => [ac.text.trim().toLowerCase(), ac])).values()], mockups: targets.flatMap(s => s.mockups), openQuestions: [...new Set(targets.flatMap(s => s.openQuestions))] }];
    }
    const finding = { id: id('finding'), type: input.type, storyIds: targets.map(s => s.id), before: structuredClone(targets), replacements, problem: input.type === 'split' ? 'Käsitsi jagamise eelvaade' : 'Kattuvate lugude ühendamise eelvaade', reason: 'Kontrolli kriteeriumide jaotust enne kinnitamist.', proposal: replacements.map(s => s.title).join(' / ') };
    addConversation(project, 'user', finding.problem);
    addConversation(project, 'ai', 'Vaata muudatus üle ja kinnita.', [], { type: 'grooming', findings: [finding] });
    await writeDb(db);
    return json(res, 200, project);
  }
  if (req.method === 'POST' && action === 'apply-proposal') {
    const input = await body(req);
    const proposal = project.pendingProposal;
    if (!proposal) return json(res, 409, { error: 'Ettepanek on juba rakendatud või tagasi lükatud.' });
    const after = structuredClone(proposal.after);
    if (input.criteria) {
      if (!Array.isArray(input.criteria) || input.criteria.some(ac => typeof ac.text !== 'string')) return json(res, 400, { error: 'Vigased kriteeriumid.' });
      after.criteria = input.criteria.map(ac => ({ ...ac, valid: validateCriterion(ac.text) }));
    }
    const index = project.backlog.findIndex(s => s.id === proposal.storyId);
    if (proposal.type !== 'new-view' && (index < 0 || JSON.stringify(project.backlog[index]) !== JSON.stringify(proposal.before))) return json(res, 409, { error: 'Lugu muutus pärast ettepanekut. Koosta uus ettepanek.' });
    snapshot(project);
    if (after.mockups.at(-1)) after.mockups.at(-1).criteria = structuredClone(after.criteria);
    if (proposal.type === 'new-view') { project.backlog.push({ ...after, projectId: project.id, order: project.backlog.length + 1 }); project.selectedStoryId = after.id; }
    else project.backlog[index] = { ...after, id: proposal.storyId, order: project.backlog[index].order, projectId: project.id };
    delete project.pendingProposal;
    addConversation(project, 'ai', 'Muudatus kinnitatud. Vali järgmine samm.', ['Järgmine lugu', "Vaatame backlog'i üle", 'Lõpetame kohtumise']);
    project.updatedAt = now();
    await writeDb(db);
    return json(res, 200, project);
  }
  if (req.method === 'POST' && action === 'apply-finding') {
    const input = await body(req);
    const finding = project.conversations.flatMap(msg => msg.proposal?.findings || []).find(f => f.id === input.finding?.id);
    if (!finding || finding.applied || finding.ignored) return json(res, 409, { error: 'Ettepanek pole enam rakendatav.' });
    if (finding.before.some(s => JSON.stringify(project.backlog.find(item => item.id === s.id)) !== JSON.stringify(s))) return json(res, 409, { error: 'Backlog muutus. Käivita uus ülevaatus.' });
    if (input.edits) {
      if (!Array.isArray(input.edits) || input.edits.length !== finding.replacements.length || input.edits.some(edit => typeof edit.title !== 'string' || !Array.isArray(edit.criteria) || edit.criteria.some(text => typeof text !== 'string'))) return json(res, 400, { error: 'Vigane muudatus.' });
      finding.replacements.forEach((s, i) => { s.title = input.edits[i].title; Object.assign(s, splitConnextra(s.title)); s.criteria = input.edits[i].criteria.map((text, j) => ({ ...(s.criteria[j] || criterion(text, '')), text })); });
    }
    snapshot(project);
    const index = Math.min(...finding.storyIds.map(target => project.backlog.findIndex(s => s.id === target)));
    project.backlog = project.backlog.filter(s => !finding.storyIds.includes(s.id));
    project.backlog.splice(index, 0, ...structuredClone(finding.replacements).map(s => ({ ...s, projectId: project.id })));
    project.backlog.forEach((s, i) => { s.order = i + 1; });
    finding.applied = true;
    if (!project.backlog.some(s => s.id === project.selectedStoryId)) project.selectedStoryId = finding.replacements[0].id;
    project.updatedAt = now();
    await writeDb(db);
    return json(res, 200, project);
  }

  if (req.method === "GET" && !action) return json(res, 200, project);

  if (req.method === "PUT" && !action) {
    const input = await body(req);
    snapshot(project);
    for (const field of ['name', 'description']) if (typeof input[field] === 'string') project[field] = input[field];
    if (Array.isArray(input.roles) && input.roles.every(role => typeof role === 'string')) project.roles = [...new Set(input.roles.map(role => role.trim()).filter(Boolean))];
    project.updatedAt = now();
    await writeDb(db);
    return json(res, 200, project);
  }

  if (req.method === "POST" && action === "add-stories") {
    const input = await body(req);
    const latestProposal = [...project.conversations].reverse().find((msg) => msg.proposal?.type === "story-proposal")?.proposal;
    const selectedIds = new Set(input.storyIds || latestProposal?.stories?.map((s) => s.id) || []);
    const stories = (latestProposal?.stories || []).filter((s) => selectedIds.has(s.id)).map((s, index) => ({ ...s, selected: undefined, order: project.backlog.length + index + 1 }));
    if (!stories.length) return json(res, 400, { error: 'Vali vähemalt üks lugu.' });
    if (stories.some(s => project.backlog.some(existing => existing.id === s.id))) return json(res, 409, { error: 'Need lood on juba lisatud.' });
    let priority;
    try { priority = await requestAI('priority', { ...project, backlog: [...project.backlog, ...stories] }); }
    catch (error) { priority = { recommendedStoryId: stories[0].id, message: `Lood on lisatud. AI soovitus pole hetkel saadaval: ${error.message} Milline lugu on kõige olulisem?`, choices: ['Valin ise teise'] }; }
    snapshot(project);
    project.backlog.push(...stories.map(s => ({ ...s, projectId: project.id })));
    project.currentStage = "Prioriteedid";
    const recommendation = project.backlog.find(s => s.id === priority.recommendedStoryId);
    project.selectedStoryId = recommendation?.id || null;
    addConversation(project, "ai", priority.message, priority.choices, { type: "priority", recommendedStoryId: recommendation?.id });
    project.updatedAt = now();
    await writeDb(db);
    return json(res, 200, project);
  }

  if (req.method === "POST" && action === "select-story") {
    const input = await body(req);
    snapshot(project);
    if (!project.backlog.some(s => s.id === input.storyId)) return json(res, 404, { error: 'Lugu ei leitud.' });
    project.selectedStoryId = input.storyId;
    project.currentStage = "Kriteeriumid ja mockup";
    const selected = project.backlog.find((s) => s.id === input.storyId);
    addConversation(project, "user", `Alustame looga: ${selected?.title}`);
    addConversation(project, "ai", "Pakun valitud loole vastuvõtukriteeriumid ja mockup'i.", ["Koosta kriteeriumid ja mockup", "Valin teise loo"]);
    project.updatedAt = now();
    await writeDb(db);
    return json(res, 200, project);
  }

  if (req.method === "POST" && action === "backlog") {
    const input = await body(req);
    if (!Array.isArray(input.backlog) || input.backlog.some(s => typeof s.id !== 'string' || typeof s.title !== 'string' || !Array.isArray(s.criteria) || s.criteria.some(ac => typeof ac.text !== 'string') || !Array.isArray(s.mockups) || !Array.isArray(s.openQuestions)) || new Set(input.backlog.map(s => s.id)).size !== input.backlog.length) return json(res, 400, { error: 'Vigane backlog.' });
    snapshot(project);
    const nextBacklog = input.backlog.map((s, i) => ({ ...s, order: i + 1, projectId: project.id, ...splitConnextra(s.title) }));
    for (const s of nextBacklog) if (s.status === 'Valmis arenduseks' && !readiness(s).ready) return json(res, 409, { error: 'Lugu ei vasta valmisoleku definitsioonile.', missing: readiness(s).missing });
    nextBacklog.forEach(s => { if (s.mockups.at(-1)) s.mockups.at(-1).criteria = structuredClone(s.criteria); });
    project.backlog = nextBacklog;
    if (!project.backlog.some(s => s.id === project.selectedStoryId)) project.selectedStoryId = project.backlog[0]?.id || null;
    project.mvpAfterOrder = input.mvpAfterOrder ?? project.mvpAfterOrder;
    project.updatedAt = now();
    await writeDb(db);
    return json(res, 200, project);
  }

  if (req.method === "POST" && action === "status") {
    const input = await body(req);
    snapshot(project);
    const selected = project.backlog.find((s) => s.id === input.storyId);
    if (!selected) return json(res, 404, { error: "Story not found" });
    if (!['Idee', 'Vajab täpsustamist', 'Läbivaadatud', 'Valmis arenduseks'].includes(input.status)) return json(res, 400, { error: 'Tundmatu staatus.' });
    const check = readiness(selected);
    if (input.status === "Valmis arenduseks" && !check.ready) return json(res, 409, { error: "Lugu ei vasta valmisoleku definitsioonile.", missing: check.missing });
    selected.status = input.status;
    project.updatedAt = now();
    await writeDb(db);
    return json(res, 200, project);
  }

  if (req.method === "POST" && action === "undo") {
    const previous = project.undoStack?.pop();
    if (!previous) return json(res, 400, { error: "Tagasivõetavat muudatust pole." });
    Object.assign(project, previous, { updatedAt: now() });
    await writeDb(db);
    return json(res, 200, project);
  }

  if (req.method === "GET" && action === "export") {
    const lines = [`# ${project.name}`, "", project.description, "", "## Backlog"];
    for (const s of [...project.backlog].sort((a, b) => a.order - b.order)) {
      lines.push("", `### ${s.order}. ${s.title}`, `- Staatus: ${s.status}`, `- Suurus: ${s.size}`, `- Päritolu: ${s.origin}`);
      lines.push("- Kriteeriumid:");
      for (const ac of s.criteria || []) lines.push(`  - ${ac.text}`);
      if (s.openQuestions?.length) lines.push(`- Avatud küsimused: ${s.openQuestions.join("; ")}`);
      if (s.order === project.mvpAfterOrder) lines.push("", "--- MVP joon ---");
    }
    res.writeHead(200, { "content-type": "text/markdown; charset=utf-8", "content-disposition": `attachment; filename="${project.name.replaceAll(" ", "-")}-backlog.md"` });
    return res.end(lines.join("\n"));
  }

  return json(res, 404, { error: "Not found" });
}

async function serveStatic(req, res, pathname) {
  const file = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(PUBLIC_DIR, safePath);
  if (!fullPath.startsWith(PUBLIC_DIR)) return json(res, 403, { error: "Forbidden" });
  try {
    const content = await readFile(fullPath);
    const ext = path.extname(fullPath);
    const type = ext === ".html" ? "text/html" : ext === ".css" ? "text/css" : ext === ".js" ? "text/javascript" : "application/octet-stream";
    res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

let apiQueue = Promise.resolve();
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      const pending = apiQueue.then(() => api(req, res, url.pathname));
      apiQueue = pending.catch(() => {});
      return await pending;
    }
    return await serveStatic(req, res, url.pathname);
  } catch (error) {
    json(res, error.status || 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`TAK25 app running at http://localhost:${server.address().port}`);
});
