import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('manual workflow works without AI, previews require confirmation, undo and restart preserve state', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'tak25-test-'));
  let child;
  const start = () => new Promise((resolve, reject) => {
    child = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: '0', DATA_DIR: directory, GROQ_API_KEY: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.once('error', reject);
    child.stdout.once('data', output => resolve(output.toString().match(/http:\/\/localhost:\d+/)[0]));
  });
  const stop = () => new Promise(resolve => { child.once('exit', resolve); child.kill(); });
  try {
    let base = await start();
    const call = async (route, data) => {
      const response = await fetch(`${base}/api${route}`, data !== undefined ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) } : {});
      return { status: response.status, data: await response.json() };
    };
    const p = (await call('/projects', { name: 'Test' })).data;
    const route = `/projects/${p.id}`;
    const title = 'Külastajana soovin näha pakette, et valida pakett';
    const criteria = ['Paketi nimi kuvatakse.', 'Paketi hind kuvatakse.', 'Paketi kestus kuvatakse.'].map((text, i) => ({ id: `ac${i}`, text, accepted: true, mockupElementId: 'packages' }));
    const s = { id: 'original', title, criteria, size: 'M', status: 'Läbivaadatud', mockups: [{ id: 'v1', version: 1, components: [{ id: 'packages', type: 'note', text: 'Pakett 29 EUR kuus' }], criteria }], openQuestions: [], origin: 'käsitsi lisatud' };
    assert.equal((await call(`${route}/backlog`, { backlog: [s] })).status, 200);
    assert.equal((await call(`${route}/status`, { storyId: s.id, status: 'Valmis arenduseks' })).status, 200);
    assert.equal((await call(`${route}/status`, { storyId: s.id, status: 'Vajab täpsustamist' })).status, 200);
    const questions = { ...s, status: 'Vajab täpsustamist', openQuestions: ['Kuidas tasutakse?'] };
    await call(`${route}/backlog`, { backlog: [questions] });
    assert.equal((await call(`${route}/status`, { storyId: s.id, status: 'Valmis arenduseks' })).status, 409);
    const preview = (await call(`${route}/manual-groom`, { type: 'split', storyIds: [s.id], titles: [title, 'Külastajana soovin valida paketti, et alustada liitumist'] })).data;
    assert.equal(preview.backlog.length, 1);
    const finding = preview.conversations.at(-1).proposal.findings[0];
    const applied = await call(`${route}/apply-finding`, { finding: { id: finding.id } });
    assert.equal(applied.data.backlog.length, 2);
    assert.equal((await call(`${route}/apply-finding`, { finding: { id: finding.id } })).status, 409);
    assert.equal((await call(`${route}/undo`, {})).data.backlog.length, 1);
    assert.equal((await call(`${route}/idea`, { idea: 'Spordiklubi veeb' })).status, 503);
    await stop(); base = await start();
    const reopened = (await call(route)).data;
    assert.equal(reopened.backlog[0].id, 'original');
    assert.equal(reopened.backlog[0].mockups[0].id, 'v1');
    assert.ok(reopened.conversations.length);
  } finally { if (child?.exitCode === null) await stop(); await rm(directory, { recursive: true, force: true }); }
});
