import { validateCriterion, readiness } from './domain.js';

const stages = ["Idee", "Rollid", "Lood", "Prioriteedid", "Kriteeriumid ja mockup", "Täpsustused", "Groomimine"];
const statusOptions = ["Idee", "Vajab täpsustamist", "Läbivaadatud", "Valmis arenduseks"];
let state = { projects: [], project: null, draftIdea: "", customAnswer: "", checkedProposal: new Set(), proposalId: null, highlight: null, error: "", busy: false, previewVersion: null };

const app = document.querySelector("#app");

async function api(path, options = {}) {
  state.error = '';
  const mutating = options.method && options.method !== 'GET';
  const aiRequest = /\/(?:idea|answer|regenerate|priority|generate-design|clarify|review|new-view|chat)$/.test(path);
  const indicator = document.querySelector('[data-request-status]');
  if (indicator) indicator.textContent = aiRequest ? 'AI koostab ettepanekut…' : mutating ? 'Salvestamine…' : '';
  if (mutating) { state.busy = true; document.querySelectorAll('button:not(:disabled)').forEach(el => { el.disabled = true; el.dataset.busyDisabled = '1'; }); }
  try {
  const res = await fetch(path, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw data;
  return data;
  } finally {
    if (mutating) { state.busy = false; document.querySelectorAll('[data-busy-disabled]').forEach(el => { el.disabled = false; delete el.dataset.busyDisabled; }); }
    if (indicator) indicator.textContent = '';
  }
}

async function load() {
  state.projects = await api("/api/projects");
  if (!state.project && state.projects[0]) state.project = await api(`/api/projects/${state.projects[0].id}`);
  render();
}

function setProject(project) {
  state.project = project;
  state.projects = state.projects.map((p) => p.id === project.id ? project : p);
  render();
}

async function createProject(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const project = await api("/api/projects", { method: "POST", body: JSON.stringify({ name: form.get("name"), description: form.get("description") }) });
  state.projects.unshift(project);
  state.project = project;
  formElement.reset();
  render();
}

async function openProject(id) {
  state.project = await api(`/api/projects/${id}`);
  state.previewVersion = null;
  render();
}

async function sendIdea() {
  if (!state.draftIdea.trim()) return;
  setProject(await api(`/api/projects/${state.project.id}/idea`, { method: "POST", body: JSON.stringify({ idea: state.draftIdea }) }));
  state.draftIdea = "";
}

async function answerQuestion(key, values, text = "") {
  setProject(await api(`/api/projects/${state.project.id}/answer`, { method: "POST", body: JSON.stringify({ key, values, text }) }));
  state.customAnswer = "";
}

async function addStories(ids) {
  setProject(await api(`/api/projects/${state.project.id}/add-stories`, { method: "POST", body: JSON.stringify({ storyIds: ids }) }));
  state.checkedProposal = new Set();
}

async function selectStory(id) {
  setProject(await api(`/api/projects/${state.project.id}/select-story`, { method: "POST", body: JSON.stringify({ storyId: id }) }));
}

async function generateDesign() {
  if (!state.project.selectedStoryId && selectedStory()) await selectStory(selectedStory().id);
  setProject(await api(`/api/projects/${state.project.id}/generate-design`, { method: "POST" }));
}

async function clarify(text) {
  if (!text.trim()) return;
  setProject(await api(`/api/projects/${state.project.id}/clarify`, { method: "POST", body: JSON.stringify({ text }) }));
}

async function applyProposal() {
  const proposal = state.project.pendingProposal;
  const criteria = proposal?.type === 'criteria-mockup' ? [...document.querySelectorAll('[data-draft-criterion]')].filter(el => el.closest('.criterion').querySelector('input').checked).map(el => ({ ...proposal.criteria[Number(el.dataset.draftCriterion)], text: el.value, accepted: true })) : undefined;
  setProject(await api(`/api/projects/${state.project.id}/apply-proposal`, { method: "POST", body: JSON.stringify({ criteria }) }));
}

async function saveBacklog(backlog = state.project.backlog, mvpAfterOrder = state.project.mvpAfterOrder) {
  const revision = state.backlogRevision = (state.backlogRevision || 0) + 1;
  state.project.backlog = structuredClone(backlog);
  const project = await api(`/api/projects/${state.project.id}/backlog`, { method: "POST", body: JSON.stringify({ backlog, mvpAfterOrder }) });
  if (revision === state.backlogRevision) setProject(project);
}

async function updateStatus(storyId, status) {
  try {
    setProject(await api(`/api/projects/${state.project.id}/status`, { method: "POST", body: JSON.stringify({ storyId, status }) }));
  } catch (error) {
    state.error = [error.error, ...(error.missing || [])].join(' '); render();
  }
}

async function reviewBacklog() {
  setProject(await api(`/api/projects/${state.project.id}/review`, { method: "POST" }));
}

async function applyFinding(finding) {
  const root = document.querySelector(`[data-finding-id="${finding.id}"]`);
  const edits = finding.replacements.map((s, i) => ({ title: root.querySelector(`[data-finding-title="${i}"]`).value, criteria: root.querySelector(`[data-finding-criteria="${i}"]`).value.split('\n').filter(text => text.trim()) }));
  setProject(await api(`/api/projects/${state.project.id}/apply-finding`, { method: "POST", body: JSON.stringify({ finding: { id: finding.id }, edits }) }));
}

async function undo() {
  try {
    setProject(await api(`/api/projects/${state.project.id}/undo`, { method: "POST" }));
  } catch (error) {
    state.error = error.error || 'Tagasivõtmine ebaõnnestus.'; render();
  }
}

function selectedStory() {
  return state.project?.backlog?.find((s) => s.id === state.project.selectedStoryId) || state.project?.backlog?.[0];
}

function latestProposal(type) {
  return [...(state.project?.conversations || [])].reverse().find((msg) => msg.proposal?.type === type)?.proposal;
}

function escapeHtml(value = "") {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[char]));
}

function render() {
  app.innerHTML = `
    <div class="shell">
      ${renderSidebar()}
      <main class="main">${state.project ? renderProject() : `<div class="empty">Loo esimene projekt, et alustada.</div>`}</main>
    </div>`;
  bind();
}

function renderSidebar() {
  return `
    <aside class="sidebar">
      <div class="brand">
        <h1>TAK25 Backlog</h1>
        <p>AI juhib protsessi, inimene kinnitab otsused.</p>
      </div>
      <form class="project-form" data-create-project>
        <input name="name" placeholder="Projekti nimi" required>
        <textarea name="description" placeholder="Lühikirjeldus"></textarea>
        <button class="primary" type="submit">Loo projekt</button>
      </form>
      <div class="project-list">
        ${state.projects.map((p) => `
          <button class="project-button ${state.project?.id === p.id ? "active" : ""}" data-open-project="${p.id}">
            ${escapeHtml(p.name)}
            <small>${escapeHtml(p.currentStage || "Idee")} · ${p.backlog?.length || 0} lugu</small>
          </button>`).join("")}
      </div>
    </aside>`;
}

function renderProject() {
  return `
    ${state.error ? `<div class="error" role="alert">${escapeHtml(state.error)}</div>` : ''}
    <section class="topbar">
      <div>
        <h2>${escapeHtml(state.project.name)}</h2>
        <p>${escapeHtml(state.project.description || "Kirjelda kliendi algset ideed ja lase rakendusel vestlust juhtida.")}</p>
      </div>
      <div class="toolbar">
        <button data-close-project>Sulge projekt</button>
        <button data-undo title="Võta viimane muudatus tagasi">↶</button>
        <a href="/api/projects/${state.project.id}/export"><button>Ekspordi MD</button></a>
      </div>
    </section>
    <nav class="steps">${stages.map((stage) => `<button class="step ${stage === state.project.currentStage ? "active" : ""}" data-stage="${stage}">${stage}</button>`).join("")}</nav>
    <div class="roles"><strong>Rollid</strong>${(state.project.roles || []).map(role => `<span>${escapeHtml(role)} <button data-remove-role="${escapeHtml(role)}" title="Eemalda roll">×</button></span>`).join('')}<button data-add-role>Lisa roll</button></div>
    <section class="workspace">
      ${renderConversation()}
      ${renderBacklogPanel()}
    </section>`;
}

function renderConversation() {
  return `
    <section class="panel">
      <div class="panel-header"><h3>Juhitud vestlus</h3><button data-review>Vaata backlog üle</button></div>
      <div class="request-status" data-request-status role="status" aria-live="polite"></div>
      <div class="panel-body chat">
        ${(state.project.conversations || []).map(renderMessage).join("")}
        ${state.project.pendingProposal ? renderProposal(state.project.pendingProposal) : ''}
        <div class="actions"><button data-resume>Jätka: ${escapeHtml(state.project.currentStage)}</button><button data-next-story>Järgmine lugu</button><button data-end-meeting>Lõpeta kohtumine</button></div>
        ${renderCurrentInput()}
      </div>
    </section>`;
}

function renderMessage(msg) {
  return `
    <article class="message ${msg.speaker}">
      <strong>${msg.speaker === "ai" ? "AI" : "Kasutaja"}</strong>
      <div>${escapeHtml(msg.text)}</div>
      ${msg.proposal && !['criteria-mockup','clarification','new-view'].includes(msg.proposal.type) && msg.id === state.project.conversations.filter(m => m.speaker === 'ai').at(-1)?.id ? renderProposal(msg.proposal) : ""}
      ${msg.actions?.length && !msg.proposal && msg.id === state.project.conversations.at(-1)?.id ? `<div class="actions">${msg.actions.map((a) => `<button data-action-text="${escapeHtml(a)}">${escapeHtml(a)}</button>`).join("")}</div>` : ""}
    </article>`;
}

function renderProposal(proposal) {
  if (proposal.type === "question") return renderQuestion(proposal);
  if (proposal.type === "story-proposal") return renderStoryProposal(proposal);
  if (proposal.type === "priority") return renderPriority(proposal);
  if (proposal.type === "criteria-mockup") return renderDesignProposal(proposal);
  if (proposal.type === "clarification") return renderClarification(proposal);
  if (proposal.type === "grooming") return renderGrooming(proposal);
  if (proposal.type === 'new-view') return `<p>${escapeHtml(proposal.after.title)}</p>${renderMockup(proposal.after.mockups.at(-1))}${proposal.after.criteria.map(ac => `<p>${escapeHtml(ac.text)}</p>`).join('')}<button data-apply-proposal>Lisa backlog'i</button><button data-discard-proposal>Loobu</button>`;
  return "";
}

function renderQuestion(proposal) {
  const choices = proposal.choices ? [...proposal.choices, 'Muu (kirjutan ise)', 'Jäta vahele'] : proposal.key === "roles"
    ? ["Külastaja", "Klubi liige", "Treener", "Administraator", "Muu (kirjutan ise)", "Jäta vahele"]
    : ["Jah, veebis", "Ei, kohapeal", "Otsustame hiljem", "Muu (kirjutan ise)", "Jäta vahele"];
  return `
    <div class="actions" data-question="${proposal.key}" data-multi="${proposal.multi ? "1" : "0"}">
      ${choices.map((choice) => `<label class="choice"><input type="${proposal.multi ? "checkbox" : "radio"}" name="${proposal.key}" value="${escapeHtml(choice)}"> ${escapeHtml(choice)}</label>`).join("")}
      <button class="primary" data-submit-answer="${proposal.key}">Vasta</button>
    </div>
    <div class="input-row">
      <input data-custom-answer="${proposal.key}" placeholder="Või kirjuta oma vastus">
    </div>`;
}

function renderStoryProposal(proposal) {
  const proposalId = proposal.stories.map(s => s.id).join(',');
  if (state.proposalId !== proposalId) { state.proposalId = proposalId; state.checkedProposal = new Set(proposal.stories.map(s => s.id)); }
  return `
    <div class="cards">
      ${proposal.stories.map((s) => `
        <label class="story-card">
          <span class="story-head">
            <input type="checkbox" data-proposal-story="${s.id}" ${state.checkedProposal.has(s.id) ? "checked" : ""}>
            <span>
              <span class="story-title" contenteditable="true" data-edit-proposed="${s.id}">${escapeHtml(s.title)}</span>
              <span class="meta"><span class="pill">${escapeHtml(s.role)}</span><span class="pill">${s.size}</span><span class="pill">#${s.order}</span></span>
            </span>
          </span>
        </label>`).join("")}
    </div>
    <div class="actions">
      <button class="primary" data-add-selected>Lisa valitud</button>
      <button data-add-all>Lisa kõik backlog'i</button>
      <button data-other-stories>Paku teistsuguseid</button>
      <button data-reject-stories>Lükka tagasi</button>
    </div>`;
}

function renderPriority(proposal) {
  const recommended = state.project.backlog.find((s) => s.id === proposal.recommendedStoryId);
  return `
    <div class="actions">
      <button class="primary" data-select-story="${proposal.recommendedStoryId}">Nõus, alustame sellest</button>
      <select data-priority-select>
        ${(state.project.backlog || []).map((s) => `<option value="${s.id}" ${s.id === recommended?.id ? "selected" : ""}>${escapeHtml(s.title)}</option>`).join("")}
      </select>
      <button data-select-from-dropdown>Valin ise teise</button>
    </div>`;
}

function renderDesignProposal(proposal) {
  return `
    <div class="split">
      <div>${proposal.criteria.map((ac, index) => `<div class="criterion"><input type="checkbox" aria-label="Kinnita kriteerium ${index + 1}" ${ac.accepted === false ? '' : 'checked'}><textarea data-draft-criterion="${index}">${escapeHtml(ac.text)}</textarea><button data-remove-draft="${index}" title="Eemalda kriteerium">×</button><div class="warning">${validateCriterion(ac.text).warnings.map(escapeHtml).join('<br>')}</div></div>`).join('')}</div>
      <div>${renderMockup(proposal.mockup)}</div>
    </div>
    <div class="actions">
      <button class="primary" data-apply-proposal>Kinnita valitud</button>
      <button data-add-draft>Lisa kriteerium</button>
      <button data-discard-proposal>Lükka tagasi</button>
    </div>
    <div class="input-row">
      <textarea data-clarification placeholder="Sisesta kliendi täpsustus, nt paketi hinnas peab olema näha, kas see sisaldab käibemaksu"></textarea>
      <button class="primary" data-send-clarification>Sisesta täpsustus</button>
    </div>`;
}

function renderClarification(proposal) {
  return `
    <p><span class="pill ok">${escapeHtml(proposal.impact)}</span></p>
    <div class="proposal-compare">
      <div><strong>Enne</strong><p>${escapeHtml(proposal.before.title)}</p>${proposal.before.criteria.map(ac => `<p>${escapeHtml(ac.text)}</p>`).join('')}${renderMockup(proposal.before.mockups.at(-1))}</div>
      <div><strong>Pärast</strong><p>${escapeHtml(proposal.after.title)}</p>${renderMockup(proposal.after.mockups.at(-1))}</div>
    </div>
    <div class="criteria">${proposal.after.criteria.map((ac) => `<div class="criterion"><span>✓</span><span>${escapeHtml(ac.text)}</span></div>`).join("")}</div>
    <div class="actions">
      <button class="primary" data-apply-proposal>Rakenda</button>
      <button data-edit-proposal>Muuda</button>
      <button data-discard-proposal>Loobu</button>
    </div>`;
}

function renderGrooming(proposal) {
  if (!proposal.findings.length) return `<p class="pill ok">Probleeme ei leitud.</p>`;
  return `<div class="cards">${proposal.findings.map((finding, index) => finding.applied || finding.ignored ? '' : `
    <article class="story-card finding" data-finding-id="${finding.id}">
      <div class="story-title">${escapeHtml(finding.problem)}</div>
      <p>${escapeHtml(finding.reason)}</p>
      <p><strong>Ettepanek:</strong> ${escapeHtml(finding.proposal)}</p>
      <div class="proposal-compare"><div><strong>Enne</strong>${(finding.before || []).map(s => `<p>${escapeHtml(s.title)}</p>`).join('')}</div><div><strong>Pärast</strong>${(finding.replacements || []).map(s => `<p>${escapeHtml(s.title)}</p>${s.criteria.map(ac => `<p>${escapeHtml(ac.text)}</p>`).join('')}`).join('')}</div></div>
      ${finding.replacements.map((s, i) => `<div class="finding-edit"><textarea data-finding-title="${i}" aria-label="Loo pealkiri">${escapeHtml(s.title)}</textarea><textarea data-finding-criteria="${i}" aria-label="Kriteeriumid">${escapeHtml(s.criteria.map(ac => ac.text).join('\n'))}</textarea></div>`).join('')}
      <div class="actions">
        <button class="primary" data-apply-finding="${index}">Rakenda</button>
        <button data-edit-finding="${index}">Muuda</button>
        <button data-ignore-finding="${index}">Ignoreeri</button>
      </div>
    </article>`).join("")}</div>`;
}

function renderCurrentInput() {
  if (!state.project.conversations?.length || state.project.currentStage === "Idee") {
    return `
      <div class="message user">
        <strong>Esimene kirjeldus</strong>
        <textarea data-idea placeholder="Näide: Spordiklubi tahab veebi, kus saab treeningutega tutvuda ja liikmeks astuda.">${escapeHtml(state.draftIdea)}</textarea>
        <div class="actions"><button class="primary" data-send-idea>Alusta vestlust</button></div>
      </div>`;
  }
  return `<div class="input-row"><textarea data-free-text placeholder="Kirjuta vastus või täpsustus"></textarea><button data-send-free>Saada</button><button data-new-view>Loo uus vaade</button></div>`;
}

function renderBacklogPanel() {
  const story = selectedStory();
  return `
    <section class="panel">
      <div class="panel-header">
        <h3>Backlog</h3>
        <div class="toolbar">
          <button data-add-manual>Lisa lugu</button>
          <button data-generate-design ${story ? "" : "disabled"}>Mockup + kriteeriumid</button>
        </div>
      </div>
      <div class="panel-body">
        ${(state.project.backlog || []).length ? renderBacklog() : `<div class="empty">Backlog on veel tühi. Vasta AI küsimustele ja lisa valitud lood.</div>`}
        ${story ? `<hr>${renderStoryDetail(story)}` : ""}
      </div>
    </section>`;
}

function renderBacklog() {
  const sorted = [...state.project.backlog].sort((a, b) => a.order - b.order);
  return `
    <div class="cards">
      ${sorted.map((s, index) => `
        ${index + 1 === state.project.mvpAfterOrder + 1 ? `<div class="pill warn">MVP joon</div>` : ""}
        <article class="story-card ${s.id === state.project.selectedStoryId ? "selected" : ""}" draggable="true" data-story-card="${s.id}">
          <div class="story-head">
            <button class="icon" data-move-up="${s.id}" title="Liiguta üles">↑</button>
            <div>
              <div class="story-title" contenteditable="true" data-edit-title="${s.id}">${escapeHtml(s.title)}</div>
              <div class="meta">
                <span class="pill">${escapeHtml(s.status)}</span>
                <span class="pill">${escapeHtml(s.size)}</span>
                <span class="pill">${s.criteria?.length || 0} kriteeriumi</span>
                ${(s.openQuestions || []).length ? `<span class="pill warn">täpsustada</span>` : ""}
              </div>
            </div>
            <button class="icon" data-move-down="${s.id}" title="Liiguta alla">↓</button>
          </div>
          <div class="toolbar">
            <button data-select-local="${s.id}">Vali</button>
            <button data-mvp="${s.order}">MVP siia</button>
            <button data-needs-clarification="${s.id}">Vajab täpsustamist</button>
            <button data-manual-split="${s.id}">Jaga</button>
            <button data-manual-merge="${s.id}">Märgi kattuvaks / ühenda</button>
            <select data-status="${s.id}">${statusOptions.map((status) => `<option ${status === s.status ? "selected" : ""}>${status}</option>`).join("")}</select>
            <button data-delete-story="${s.id}">Kustuta</button>
          </div>
        </article>`).join("")}
    </div>`;
}

function renderStoryDetail(story) {
  const latestMockup = story.mockups?.find(m => m.id === state.previewVersion) || story.mockups?.at(-1);
  return `
    <div class="split">
      <div>
        <h3>Valitud lugu</h3>
        <p><strong>${escapeHtml(story.title)}</strong></p>
        <p class="warning">${readiness(story).missing.map(escapeHtml).join('<br>')}</p>
        <select data-edit-size="${story.id}">${['S','M','L'].map(size => `<option ${size === story.size ? 'selected' : ''}>${size}</option>`).join('')}</select>
        <textarea data-open-questions="${story.id}" placeholder="Avatud küsimused (üks rea kohta)">${escapeHtml((story.openQuestions || []).join('\n'))}</textarea>
        <div class="criteria">${renderCriteria(story.id)}</div>
        <button data-add-criterion="${story.id}">Lisa kriteerium</button>
      </div>
      <div>
        <h3>Mockup</h3>
        ${story.mockups?.length ? `<select data-mockup-version>${story.mockups.map(m => `<option value="${m.id}" ${m.id === latestMockup.id ? 'selected' : ''}>Versioon ${m.version}</option>`).join('')}</select><button data-restore-mockup>Taasta versioon</button>` : ''}
        ${latestMockup ? renderMockup(latestMockup) : `<div class="empty">Sellel lool pole veel mockup'i.</div>`}
      </div>
    </div>
    <div class="input-row">
      <textarea data-clarification-detail placeholder="Kliendi täpsustus valitud loole"></textarea>
      <button class="primary" data-send-clarification-detail>Sisesta täpsustus</button>
    </div>`;
}

function renderCriteria(storyId) {
  const story = state.project.backlog.find((s) => s.id === storyId) || selectedStory();
  if (!story?.criteria?.length) return `<div class="empty">Kriteeriume pole veel.</div>`;
  return story.criteria.map((ac) => {
    const warnings = validateClientCriterion(ac.text);
    return `
      <div class="criterion" data-criterion="${ac.id}">
        <input type="checkbox" data-ac-accepted="${story.id}:${ac.id}" ${ac.accepted === false ? "" : "checked"}>
        <textarea data-ac-text="${story.id}:${ac.id}">${escapeHtml(ac.text)}</textarea>
        <button class="icon" data-highlight="${escapeHtml(ac.mockupElementId || "")}" title="Näita mockup'is">⌖</button>
        <button class="icon" data-remove-ac="${story.id}:${ac.id}" title="Eemalda">×</button>
        ${story.mockups?.at(-1) ? `<select class="criterion-link" data-ac-link="${story.id}:${ac.id}" aria-label="Mockup’i element"><option value="">Seos mockup’iga</option>${story.mockups.at(-1).components.map(c => `<option value="${escapeHtml(c.id)}" ${c.id === ac.mockupElementId ? 'selected' : ''}>${escapeHtml(c.text || c.id)}</option>`).join('')}</select>` : ''}
        ${warnings.length ? `<div></div><div class="warning">${warnings.map(escapeHtml).join("<br>")}</div>` : ""}
      </div>`;
  }).join("");
}

function validateClientCriterion(text) {
  return validateCriterion(text).warnings;
}

function renderMockup(mockup) {
  if (!mockup) return "";
  return `
    <div class="mockup">
      ${(mockup.components || []).map((component) => {
        const cls = state.highlight === component.id ? " mock-highlight" : "";
        if (component.type === "heading") return `<div class="mock-heading${cls}" data-mock-id="${escapeHtml(component.id)}">${escapeHtml(component.text)}</div>`;
        if (component.type === "pricing") return `<div class="pricing${cls}" data-mock-id="${escapeHtml(component.id)}">${component.items.map((item) => `<div class="price-card"><strong>${escapeHtml(item.name)}</strong><span class="price">${escapeHtml(item.price)}</span><span>${escapeHtml(item.note)}</span></div>`).join("")}</div>`;
        if (component.type === "table") return `<div class="mock-table${cls}" data-mock-id="${escapeHtml(component.id)}">${escapeHtml(component.text)}</div>`;
        if (component.type === "button") return `<div class="mock-button${cls}" data-mock-id="${escapeHtml(component.id)}">${escapeHtml(component.text)}</div>`;
        if (component.type === 'input') return `<label class="mock-field${cls}" data-mock-id="${escapeHtml(component.id)}">${escapeHtml(component.text)}<input disabled placeholder="${escapeHtml(component.text)}"></label>`;
        if (component.type === 'select') return `<label class="mock-field${cls}" data-mock-id="${escapeHtml(component.id)}">${escapeHtml(component.text)}<select disabled>${component.items.map(item => `<option>${escapeHtml(item.name)}</option>`).join('')}</select></label>`;
        if (component.type === 'list') return `<div class="mock-table${cls}" data-mock-id="${escapeHtml(component.id)}"><strong>${escapeHtml(component.text)}</strong>${component.items.map(item => `<p>${escapeHtml(item.name)} ${escapeHtml(item.price)} ${escapeHtml(item.note)}</p>`).join('')}</div>`;
        return `<div class="mock-note${cls}" data-mock-id="${escapeHtml(component.id)}">${escapeHtml(component.text)}</div>`;
      }).join("")}
      <span class="pill">versioon ${mockup.version || 1}</span>
    </div>`;
}

function mutateBacklog(mutator) {
  const backlog = structuredClone(state.project.backlog || []);
  mutator(backlog);
  backlog.forEach((s, i) => { s.order = i + 1; });
  saveBacklog(backlog);
}

function bind() {
  document.querySelector('[data-close-project]')?.addEventListener('click', () => { state.project = null; render(); });
  const saveRoles = roles => api(`/api/projects/${state.project.id}`, { method: 'PUT', body: JSON.stringify({ roles }) }).then(setProject);
  document.querySelector('[data-add-role]')?.addEventListener('click', () => { const role = prompt('Uus roll'); if (role?.trim()) saveRoles([...state.project.roles, role.trim()]); });
  document.querySelectorAll('[data-remove-role]').forEach(el => el.addEventListener('click', () => saveRoles(state.project.roles.filter(role => role !== el.dataset.removeRole))));
  document.querySelector('[data-end-meeting]')?.addEventListener('click', () => { state.project = null; render(); });
  document.querySelector('[data-next-story]')?.addEventListener('click', () => {
    const stories = state.project.backlog;
    const index = stories.findIndex(s => s.id === state.project.selectedStoryId);
    const next = stories[index + 1] || stories[0]; if (next) selectStory(next.id); else state.error = 'Lisa kõigepealt lood backlog’i.';
  });
  document.querySelector('[data-resume]')?.addEventListener('click', () => {
    if (state.project.pendingProposal) { document.querySelector('[data-apply-proposal]')?.scrollIntoView({ block: 'center' }); return; }
    const stage = state.project.currentStage;
    if (stage === 'Idee') document.querySelector('[data-idea]')?.focus();
    else if (stage === 'Groomimine') reviewBacklog();
    else if (stage === 'Rollid') document.querySelector('[data-submit-answer]')?.scrollIntoView({ block: 'center' });
    else if (stage === 'Lood') {
      if (!document.querySelector('[data-add-selected]')) api(`/api/projects/${state.project.id}/regenerate`, { method: 'POST' }).then(setProject);
      else document.querySelector('[data-add-selected]').scrollIntoView({ block: 'center' });
    } else if (stage === 'Prioriteedid') api(`/api/projects/${state.project.id}/priority`, { method: 'POST' }).then(setProject);
    else if (stage === 'Täpsustused') document.querySelector('[data-clarification-detail]')?.focus();
    else if (selectedStory()) generateDesign();
  });
  document.querySelector('[data-reject-stories]')?.addEventListener('click', () => { state.checkedProposal.clear(); document.querySelectorAll('[data-proposal-story]').forEach(el => { el.checked = false; }); });
  document.querySelectorAll('[data-edit-proposed]').forEach(el => el.addEventListener('blur', () => api(`/api/projects/${state.project.id}/edit-proposed-story`, { method: 'POST', body: JSON.stringify({ storyId: el.dataset.editProposed, title: el.textContent }) }).then(setProject)));
  document.querySelectorAll('[data-draft-criterion]').forEach(el => el.addEventListener('input', () => { el.closest('.criterion').querySelector('.warning').textContent = validateCriterion(el.value).warnings.join(' '); }));
  const captureDraft = () => document.querySelectorAll('[data-draft-criterion]').forEach(el => { const ac = state.project.pendingProposal.criteria[Number(el.dataset.draftCriterion)]; ac.text = el.value; ac.accepted = el.closest('.criterion').querySelector('input').checked; });
  document.querySelector('[data-add-draft]')?.addEventListener('click', () => { captureDraft(); state.project.pendingProposal.criteria.push({ id: `ac_${Date.now()}`, text: '', accepted: true, mockupElementId: '' }); render(); });
  document.querySelectorAll('[data-remove-draft]').forEach(el => el.addEventListener('click', () => { captureDraft(); state.project.pendingProposal.criteria.splice(Number(el.dataset.removeDraft), 1); render(); }));
  document.querySelector('[data-mockup-version]')?.addEventListener('change', event => { state.previewVersion = event.target.value; render(); });
  document.querySelector("[data-create-project]")?.addEventListener("submit", createProject);
  document.querySelectorAll("[data-open-project]").forEach((el) => el.addEventListener("click", () => openProject(el.dataset.openProject)));
  document.querySelector("[data-idea]")?.addEventListener("input", (e) => { state.draftIdea = e.target.value; });
  document.querySelector("[data-send-idea]")?.addEventListener("click", sendIdea);
  document.querySelectorAll("[data-submit-answer]").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.submitAnswer;
    const checked = [...document.querySelectorAll(`[name="${key}"]:checked`)].map((el) => el.value).filter((v) => !v.startsWith("Muu"));
    const custom = document.querySelector(`[data-custom-answer="${key}"]`)?.value || "";
    answerQuestion(key, checked.length ? checked : custom ? [custom] : [], custom);
  }));
  document.querySelectorAll("[data-proposal-story]").forEach((box) => box.addEventListener("change", () => {
    box.checked ? state.checkedProposal.add(box.dataset.proposalStory) : state.checkedProposal.delete(box.dataset.proposalStory);
  }));
  document.querySelector("[data-add-selected]")?.addEventListener("click", () => addStories([...state.checkedProposal]));
  document.querySelector("[data-add-all]")?.addEventListener("click", () => addStories(latestProposal("story-proposal")?.stories.map((s) => s.id) || []));
  document.querySelector("[data-other-stories]")?.addEventListener("click", async () => { state.checkedProposal.clear(); setProject(await api(`/api/projects/${state.project.id}/regenerate`, { method: 'POST' })); });
  document.querySelectorAll("[data-select-story]").forEach((button) => button.addEventListener("click", () => selectStory(button.dataset.selectStory)));
  document.querySelector("[data-select-from-dropdown]")?.addEventListener("click", () => selectStory(document.querySelector("[data-priority-select]").value));
  document.querySelectorAll("[data-select-local]").forEach((button) => button.addEventListener("click", () => selectStory(button.dataset.selectLocal)));
  document.querySelectorAll("[data-stage]").forEach((button) => button.addEventListener("click", async () => setProject(await api(`/api/projects/${state.project.id}/stage`, { method: 'POST', body: JSON.stringify({ stage: button.dataset.stage }) }))));
  document.querySelector("[data-generate-design]")?.addEventListener("click", generateDesign);
  document.querySelector("[data-review]")?.addEventListener("click", reviewBacklog);
  document.querySelectorAll("[data-apply-proposal]").forEach(el => el.addEventListener("click", applyProposal));
  document.querySelectorAll('[data-discard-proposal]').forEach(el => el.addEventListener('click', async () => setProject(await api(`/api/projects/${state.project.id}/discard-proposal`, { method: 'POST' }))));
  document.querySelectorAll('[data-edit-proposal]').forEach(el => el.addEventListener('click', () => { const text = prompt('Kirjelda soovitud muudatust'); if (text) clarify(text); }));
  document.querySelector('[data-send-free]')?.addEventListener('click', () => {
    const text = document.querySelector('[data-free-text]').value;
    if (!text.trim()) return;
    const latest = state.project.conversations.at(-1)?.proposal;
    if (latest?.type === 'question') answerQuestion(latest.key, [], text);
    else if (selectedStory() && ['Kriteeriumid ja mockup', 'Täpsustused'].includes(state.project.currentStage)) clarify(text);
    else api(`/api/projects/${state.project.id}/chat`, { method: 'POST', body: JSON.stringify({ text }) }).then(setProject);
  });
  document.querySelector('[data-new-view]')?.addEventListener('click', async () => {
    const text = document.querySelector('[data-free-text]').value;
    if (text.trim()) setProject(await api(`/api/projects/${state.project.id}/new-view`, { method: 'POST', body: JSON.stringify({ text }) }));
  });
  document.querySelector('[data-restore-mockup]')?.addEventListener('click', async () => { const project = await api(`/api/projects/${state.project.id}/restore-mockup`, { method: 'POST', body: JSON.stringify({ storyId: selectedStory().id, mockupId: document.querySelector('[data-mockup-version]').value }) }); state.previewVersion = null; setProject(project); });
  document.querySelectorAll('[data-action-text]').forEach(el => el.addEventListener('click', () => {
    const action = el.dataset.actionText;
    if (/üle/.test(action)) reviewBacklog();
    else if (/kriteeriumid|mockup/i.test(action)) generateDesign();
    else if (/Järgmine/.test(action)) { const next = state.project.backlog.find(s => s.id !== state.project.selectedStoryId && !s.mockups.length); if (next) selectStory(next.id); }
    else if (/Lõpetame/.test(action)) alert('Kohtumine lõpetatud. Kõik kinnitatud muudatused on salvestatud.');
    else api(`/api/projects/${state.project.id}/chat`, { method: 'POST', body: JSON.stringify({ text: action }) }).then(setProject);
  }));
  document.querySelector("[data-send-clarification]")?.addEventListener("click", () => clarify(document.querySelector("[data-clarification]").value));
  document.querySelector("[data-send-clarification-detail]")?.addEventListener("click", () => clarify(document.querySelector("[data-clarification-detail]").value));
  document.querySelector("[data-undo]")?.addEventListener("click", undo);
  document.querySelector("[data-add-manual]")?.addEventListener("click", () => mutateBacklog((items) => items.push({ id: `manual_${Date.now()}`, title: "Külastajana soovin kirjeldada uut vajadust, et backlog oleks täpsem", role: "Külastajana", action: "kirjeldada uut vajadust", benefit: "backlog oleks täpsem", criteria: [], status: "Idee", order: items.length + 1, size: "M", mockups: [], openQuestions: [], origin: "käsitsi lisatud" })));
  document.querySelectorAll("[data-delete-story]").forEach((button) => button.addEventListener("click", () => mutateBacklog((items) => items.splice(items.findIndex((s) => s.id === button.dataset.deleteStory), 1))));
  document.querySelectorAll("[data-move-up]").forEach((button) => button.addEventListener("click", () => mutateBacklog((items) => {
    const i = items.findIndex((s) => s.id === button.dataset.moveUp);
    if (i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
  })));
  document.querySelectorAll("[data-move-down]").forEach((button) => button.addEventListener("click", () => mutateBacklog((items) => {
    const i = items.findIndex((s) => s.id === button.dataset.moveDown);
    if (i >= 0 && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
  })));
  document.querySelectorAll("[data-mvp]").forEach((button) => button.addEventListener("click", () => saveBacklog(state.project.backlog, Number(button.dataset.mvp))));
  document.querySelectorAll("[data-needs-clarification]").forEach((button) => button.addEventListener("click", () => mutateBacklog((items) => {
    const story = items.find((s) => s.id === button.dataset.needsClarification);
    story.status = "Vajab täpsustamist";
    story.openQuestions.push("Klient peab täpsustama selle loo ulatuse.");
  })));
  document.querySelectorAll("[data-status]").forEach((select) => select.addEventListener("change", () => updateStatus(select.dataset.status, select.value)));
  document.querySelectorAll("[data-edit-title]").forEach((el) => el.addEventListener("blur", () => mutateBacklog((items) => {
    const story = items.find((s) => s.id === el.dataset.editTitle);
    story.title = el.textContent.trim();
  })));
  document.querySelectorAll("[data-ac-text]").forEach((el) => el.addEventListener("blur", () => mutateBacklog((items) => {
    const [storyId, acId] = el.dataset.acText.split(":");
    const ac = items.find((s) => s.id === storyId)?.criteria.find((item) => item.id === acId);
    if (ac) ac.text = el.value.trim();
  })));
  document.querySelectorAll('[data-ac-accepted]').forEach(el => el.addEventListener('change', () => mutateBacklog(items => {
    const [storyId, criterionId] = el.dataset.acAccepted.split(':');
    items.find(s => s.id === storyId).criteria.find(ac => ac.id === criterionId).accepted = el.checked;
  })));
  document.querySelectorAll('[data-ac-link]').forEach(el => el.addEventListener('change', () => mutateBacklog(items => { const [storyId, acId] = el.dataset.acLink.split(':'); items.find(s => s.id === storyId).criteria.find(ac => ac.id === acId).mockupElementId = el.value; })));
  document.querySelectorAll('[data-edit-size]').forEach(el => el.addEventListener('change', () => mutateBacklog(items => { items.find(s => s.id === el.dataset.editSize).size = el.value; })));
  document.querySelectorAll('[data-open-questions]').forEach(el => el.addEventListener('blur', () => mutateBacklog(items => { items.find(s => s.id === el.dataset.openQuestions).openQuestions = el.value.split('\n').map(s => s.trim()).filter(Boolean); })));
  document.querySelectorAll("[data-remove-ac]").forEach((button) => button.addEventListener("click", () => mutateBacklog((items) => {
    const [storyId, acId] = button.dataset.removeAc.split(":");
    const story = items.find((s) => s.id === storyId);
    story.criteria = story.criteria.filter((ac) => ac.id !== acId);
  })));
  document.querySelectorAll("[data-add-criterion]").forEach((button) => button.addEventListener("click", () => mutateBacklog((items) => {
    const story = items.find((s) => s.id === button.dataset.addCriterion);
    story.criteria.push({ id: `ac_${Date.now()}`, text: "Uus kriteerium on kontrollitav jah/ei vastusega.", accepted: true, mockupElementId: "content" });
  })));
  document.querySelectorAll("[data-highlight]").forEach((button) => button.addEventListener("click", () => {
    state.highlight = button.dataset.highlight;
    render();
  }));
  document.querySelectorAll("[data-apply-finding]").forEach((button) => button.addEventListener("click", () => applyFinding(latestProposal("grooming").findings[Number(button.dataset.applyFinding)])));
  document.querySelectorAll('[data-ignore-finding]').forEach(el => el.addEventListener('click', async () => { const finding = latestProposal('grooming').findings[Number(el.dataset.ignoreFinding)]; setProject(await api(`/api/projects/${state.project.id}/ignore-finding`, { method: 'POST', body: JSON.stringify({ id: finding.id }) })); }));
  document.querySelectorAll('[data-manual-split]').forEach(el => el.addEventListener('click', async () => {
    const title1 = prompt('Esimese loo Connextra pealkiri'); if (!title1) return;
    const title2 = prompt('Teise loo Connextra pealkiri'); if (!title2) return;
    setProject(await api(`/api/projects/${state.project.id}/manual-groom`, { method: 'POST', body: JSON.stringify({ type: 'split', storyIds: [el.dataset.manualSplit], titles: [title1, title2] }) }));
  }));
  document.querySelectorAll('[data-manual-merge]').forEach(el => el.addEventListener('click', async () => {
    const other = prompt(`Sisesta kattuva loo järjekorranumber:\n${state.project.backlog.map(s => `${s.order}. ${s.title}`).join('\n')}`);
    const target = state.project.backlog.find(s => s.order === Number(other));
    if (!target || target.id === el.dataset.manualMerge) return;
    setProject(await api(`/api/projects/${state.project.id}/manual-groom`, { method: 'POST', body: JSON.stringify({ type: 'merge', storyIds: [el.dataset.manualMerge, target.id] }) }));
  }));
  document.querySelectorAll('[data-edit-finding]').forEach(el => el.addEventListener('click', () => { el.closest('article').querySelector('.finding-edit textarea').focus(); }));
}

window.addEventListener('unhandledrejection', event => {
  event.preventDefault();
  state.error = [event.reason?.error || event.reason?.message || 'Toiming ebaõnnestus.', ...(event.reason?.missing || [])].join(' ');
  render();
});
load();
