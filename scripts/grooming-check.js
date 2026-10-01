import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { requestAI } from '../ai.js';

process.loadEnvFile('.env');
const criteria = ['Paketi nimi kuvatakse.', 'Paketi hind kuvatakse.', 'Paketi kestus kuvatakse.'].map((text, i) => ({ id: `ac_${i}`, text, accepted: true, mockupElementId: 'packages' }));
const mockup = { id: 'm1', version: 1, title: 'Paketid', components: [{ id: 'packages', type: 'pricing', text: '', items: [{ name: 'Põhipakett', price: '29 EUR / kuu', note: '1 kuu' }] }] };
const story = { id: 's1', title: 'Külastajana soovin näha liikmepakettide hindu, et valida sobiv pakett', role: 'Külastajana', action: 'näha liikmepakettide hindu', benefit: 'valida sobiv pakett', size: 'S', status: 'Läbivaadatud', criteria, mockups: [mockup], openQuestions: [], order: 1, origin: 'käsitsi lisatud' };
const cases = [
  { name: 'Semantic overlap', type: 'merge', backlog: [story, { ...structuredClone(story), id: 's2', title: 'Külastajana soovin vaadata liikmepakettide maksumust, et valida endale sobiv pakett', order: 2 }] },
  { name: 'Subjective criterion', type: 'criteria', backlog: [{ ...structuredClone(story), criteria: [{ ...criteria[0], text: 'Pakettide vaade on kasutajasõbralik.' }, ...criteria.slice(1)] }] },
  { name: 'Missing criteria', type: 'criteria', backlog: [{ ...structuredClone(story), criteria: [] }] },
  { name: 'Missing mockup', type: 'mockup', backlog: [{ ...structuredClone(story), mockups: [] }] },
  { name: 'Malformed title', type: 'rewrite', backlog: [{ ...structuredClone(story), title: 'Pakettide hinnakiri', role: '', action: '', benefit: '' }] }
];
const results = [];
for (const scenario of cases) {
  const project = { name: 'Groomingu kontroll', description: 'Spordiklubi pakettide hinnakiri', roles: ['Külastaja'], currentStage: 'Groomimine', backlog: scenario.backlog, conversations: [] };
  let result;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { result = await requestAI('review', project); break; }
    catch (error) {
      if (/limiit/.test(error.message) && attempt < 2) { console.log('Quota cooldown: 30 seconds'); await new Promise(resolve => setTimeout(resolve, 30000)); continue; }
      console.log(`FAIL ${scenario.name}: ${error.message} (${error.cause?.message || ''})`);
      throw error;
    }
  }
  const finding = result.findings.find(f => f.type === scenario.type);
  assert.ok(finding, `${scenario.name}: expected ${scenario.type}, got ${result.findings.map(f => f.type)}`);
  if (scenario.type === 'merge') {
    assert.deepEqual(new Set(finding.storyIds), new Set(['s1', 's2']));
    assert.equal(finding.replacements.length, 1);
    const texts = finding.replacements[0].criteria.map(ac => ac.text.trim().toLowerCase());
    assert.equal(texts.length, new Set(texts).size);
  }
  assert.ok(finding.replacements.length);
  results.push({ category: scenario.name, type: finding.type, reason: finding.reason, replacementTitles: finding.replacements.map(s => s.title) });
  console.log(`PASS ${scenario.name}: ${finding.type}`);
}
await writeFile('outputs/grooming-verification.md', '# Live Grooming Verification\n\n' + results.map(r => `- ${r.category}: PASS (${r.type}). ${r.reason}\n  Replacement: ${r.replacementTitles.join(' / ')}`).join('\n\n') + '\n');
