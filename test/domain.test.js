import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCriterion, readiness } from '../public/domain.js';

test('conditional commas are valid; subjective words and joined conditions warn', () => {
  assert.equal(validateCriterion('Kui pakette pole, kuvatakse kontaktinfo.').ok, true);
  assert.equal(validateCriterion('Vaade on kasutajasõbralik.').ok, false);
  assert.equal(validateCriterion('Nimi kuvatakse ja hind kuvatakse.').ok, false);
  assert.equal(validateCriterion('').ok, false);
});
test('readiness parses title rather than trusting stale stored parts', () => {
  const s = { title: 'Katkine pealkiri', role: 'Külastajana', action: 'näha', benefit: 'valida', criteria: [], mockups: [] };
  assert.ok(readiness(s).missing.some(text => text.includes('Connextra')));
});
