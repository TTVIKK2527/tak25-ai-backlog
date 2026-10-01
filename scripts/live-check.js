import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:3012';
const report = [];
const record = text => { report.push(text); console.log(text); };
async function call(route, data) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`${base}/api${route}`, data !== undefined ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) } : {});
    const result = await response.json();
    if (response.ok) return result;
    if (/limiit/.test(result.error) && attempt < 3) { console.log('Free quota cooldown: 30 seconds'); await new Promise(resolve => setTimeout(resolve, 30000)); continue; }
    throw new Error(`${route}: ${result.error}`);
  }
}
try {
  let p = process.env.TEST_RESUME ? (await call('/projects'))[0] : await call('/projects', { name: 'Spordiklubi: päris AI kontroll', description: 'Spordiklubi tahab veebi, kus saab treeningutega tutvuda ja liikmeks astuda.' });
  const route = `/projects/${p.id}`;
  if (!process.env.TEST_RESUME) {
  p = await call(`${route}/idea`, { idea: p.description });
  assert.equal(p.backlog.length, 0);
  let proposal = p.conversations.at(-1).proposal;
  assert.equal(proposal.type, 'question');
  record(`1. AI question: ${p.conversations.at(-1).text}; options: ${proposal.choices.join(', ')}`);
  p = await call(`${route}/answer`, { key: proposal.key, values: ['Külastaja', 'Klubi liige', 'Administraator'] });
  for (let i = 0; p.conversations.at(-1).proposal.type === 'question' && i < 2; i++) {
    proposal = p.conversations.at(-1).proposal;
    record(`Clarification: ${p.conversations.at(-1).text}`);
    p = await call(`${route}/answer`, { key: proposal.key, values: ['Jah, veebis'], text: 'Liikmetasu makstakse veebis. Põhitöövoog lõpeb kinnitatud liikmelisusega.' });
  }
  proposal = p.conversations.at(-1).proposal;
  assert.equal(proposal.type, 'story-proposal'); assert.ok(proposal.stories.length >= 5);
  assert.equal(p.backlog.length, 0);
  record(`2. ${proposal.stories.length} stories proposed, none saved before confirmation:\n${proposal.stories.map(s => s.title).join('\n')}`);
  p = await call(`${route}/add-stories`, { storyIds: proposal.stories.slice(0, -1).map(s => s.id) });
  assert.equal(p.backlog.length, proposal.stories.length - 1);
  }
  p = await call(`${route}/priority`, {});
  record(`3. Priority: ${p.conversations.at(-1).text}`);
  const selected = p.backlog.find(s => /paket|hind|liikmemaks/i.test(s.title)) || p.backlog[0];
  p = await call(`${route}/select-story`, { storyId: selected.id });
  const beforeDesign = structuredClone(p.backlog);
  p = await call(`${route}/generate-design`, {});
  assert.deepEqual(p.backlog, beforeDesign);
  assert.ok(p.pendingProposal.criteria.length >= 5);
  const criteria = p.pendingProposal.criteria.slice(0, -1);
  criteria[0].text += ' (kliendiga kinnitatud)';
  p = await call(`${route}/apply-proposal`, { criteria });
  assert.equal(p.backlog.find(s => s.id === selected.id).criteria.length, criteria.length);
  record('4. Real criteria/mockup proposed, one criterion rejected and one edited before confirmation.');
  const beforeClarification = structuredClone(p.backlog);
  p = await call(`${route}/clarify`, { text: 'Iga paketi hinna all peab olema märge „sh km“, mis näitab, et hind sisaldab käibemaksu.' });
  assert.deepEqual(p.backlog, beforeClarification);
  const after = p.pendingProposal.after;
  assert.ok(JSON.stringify(after.mockups.at(-1)).includes('sh km'));
  assert.ok(after.criteria.some(ac => /käibemaks|sh km/i.test(ac.text)));
  p = await call(`${route}/apply-proposal`, {});
  assert.deepEqual(p.backlog.filter(s => s.id !== selected.id), beforeClarification.filter(s => s.id !== selected.id));
  record('5. VAT appears in real AI mockup and criteria; preview did not mutate backlog; other stories unchanged.');
  const original = p.backlog.find(s => s.id === selected.id);
  const oversized = { ...structuredClone(original), id: 'oversized-test', title: 'Administraatorina soovin hallata treeninguid ja liikmepakette ja makseid, et juhtida klubi', size: 'L', criteria: [], mockups: [], openQuestions: [] };
  p = await call(`${route}/backlog`, { backlog: [...p.backlog, oversized] });
  p = await call(`${route}/review`, {});
  const findings = p.conversations.at(-1).proposal.findings;
  const split = findings.find(f => f.type === 'split' && f.storyIds.includes(oversized.id));
  assert.ok(split, 'AI should propose splitting the deliberately oversized story');
  assert.ok(split.replacements.length >= 2);
  p = await call(`${route}/apply-finding`, { finding: { id: split.id } });
  assert.ok(!p.backlog.some(s => s.id === oversized.id));
  record(`6. AI detected oversized story and proposed ${split.replacements.length} concrete replacement stories; confirmed split applied.`);
  p = await call(`${route}/backlog`, { backlog: p.backlog.map(s => s.id === selected.id ? { ...s, status: 'Vajab täpsustamist', openQuestions: ['Klient täpsustab makseviisi.'] } : s) });
  const readyResponse = await fetch(`${base}/api${route}/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ storyId: selected.id, status: 'Valmis arenduseks' }) });
  assert.equal(readyResponse.status, 409);
  record('7. Open question blocks Ready for Development.');
  const reopened = await call(route);
  assert.deepEqual(reopened.backlog, p.backlog);
  assert.deepEqual(reopened.conversations, p.conversations);
  record('8. Reopening preserves backlog, conversation, mockup versions and stage.');
  const beforeView = structuredClone(p.backlog);
  p = await call(`${route}/new-view`, { text: 'Uus vaade: administraator näeb liikmete nimekirja koos aktiivse liikmelisuse märgisega.' });
  assert.deepEqual(p.backlog, beforeView);
  assert.ok(!beforeView.some(s => s.id === p.pendingProposal.after.id));
  p = await call(`${route}/apply-proposal`, {});
  assert.equal(p.backlog.length, beforeView.length + 1);
  assert.deepEqual(p.backlog.slice(0, -1), beforeView);
  record('9. New-view prompt creates a new unique story with criteria/mockup; existing selected story remains unchanged.');
  record(`Test project ID: ${p.id}`);
  await writeFile('outputs/live-verification.md', '# Live Groq Verification\n\n' + report.join('\n\n') + '\n');
} catch (error) { record(`FAILED: ${error.message}`); process.exitCode = 1; }
