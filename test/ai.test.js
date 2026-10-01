import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestAI } from '../ai.js';

const project = { name: 'Raamatukogu', description: 'Raamatute laenutamine', roles: [], backlog: [], conversations: [], currentStage: 'Idee' };
const valid = { message: 'Kes kasutab? Vali rollid.', kind: 'question', choices: ['Lugeja', 'Raamatukoguhoidja'], multi: true, roles: [], stories: [], recommendedStoryId: '', findings: [] };
const response = value => ({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(value) } }] }) });

test('selected answers and manually edited backlog are sent to the real API transport', async () => {
  const current = { ...project, backlog: [{ id: 'manual', title: 'Edited by user', mockups: [] }] };
  await requestAI('answer', current, { values: ['Lugeja'], text: 'ainult täiskasvanud' }, { key: 'test-only', fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    const body = JSON.parse(options.body);
    const context = JSON.parse(body.messages[1].content);
    assert.deepEqual(context.backlog, current.backlog);
    assert.deepEqual(context.input.values, ['Lugeja']);
    assert.equal(context.input.text, 'ainult täiskasvanud');
    assert.equal(body.response_format.json_schema.strict, true);
    return response(valid);
  } });
});
test('invalid output retries then reports failure', async () => {
  let calls = 0;
  await assert.rejects(requestAI('idea', project, {}, { key: 'test-only', fetchImpl: async () => { calls++; return response({ kind: 'question' }); } }), e => e.status === 422);
  assert.equal(calls, 2);
});
test('missing key does not use a fake fallback', async () => {
  await assert.rejects(requestAI('idea', project, {}, { key: '' }), e => e.status === 503);
});
test('quota errors are understandable and not retried immediately', async () => {
  let calls = 0;
  await assert.rejects(requestAI('idea', project, {}, { key: 'test-only', fetchImpl: async () => { calls++; return { ok: false, status: 429 }; } }), /limiit/);
  assert.equal(calls, 1);
});
test('rejects design without criterion-to-mockup agreement', async () => {
  const result = { ...valid, kind: 'design', stories: [{ title: 'Lugejana soovin näha raamatuid, et valida raamat', size: 'S', criteria: Array.from({ length: 3 }, () => ({ text: 'Raamatu nimi on nähtav.', mockupElementId: 'absent' })), openQuestions: [], mockupTitle: 'Raamatud', components: [] }] };
  await assert.rejects(requestAI('design', project, {}, { key: 'test-only', fetchImpl: async () => response(result) }), e => e.status === 422);
});
