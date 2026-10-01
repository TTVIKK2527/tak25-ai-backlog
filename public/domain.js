export function splitConnextra(title = '') {
  const match = title.trim().match(/^(.+?) soovin (.+?), et (.+)$/i);
  return { role: match?.[1]?.trim() || '', action: match?.[2]?.trim() || '', benefit: match?.[3]?.trim() || '' };
}

export function validateCriterion(text = '') {
  const lower = text.toLocaleLowerCase('et');
  const words = lower.match(/[\p{L}]+/gu) || [];
  const vague = ['kasutajasõbralik', 'kiire', 'lihtne', 'mugav', 'intuitiivne', 'selge', 'hea', 'parem'].filter(word => words.includes(word));
  // A conditional comma ("Kui ..., kuvatakse ...") still describes one test.
  const multi = /(?:^|\s)(?:ja|ning)(?:\s|$)|;/.test(lower);
  const warnings = [
    ...(!text.trim() ? ['Kriteerium ei tohi olla tühi.'] : []),
    ...vague.map(word => `Sisaldab hinnangulist sõna "${word}".`),
    ...(multi ? ['Võib ühendada mitu tingimust; jaga tingimused eraldi kriteeriumideks.'] : [])
  ];
  return { ok: warnings.length === 0, warnings };
}

export function readiness(story) {
  const missing = [];
  const parts = splitConnextra(story.title);
  if (!parts.role || !parts.action || !parts.benefit) missing.push('Pealkiri ei ole Connextra vormis.');
  if ((story.criteria || []).length < 3) missing.push('Vastuvõtukriteeriume peab olema vähemalt kolm.');
  if ((story.criteria || []).some(ac => !validateCriterion(ac.text).ok)) missing.push('Kõik kriteeriumid peavad läbima kontrollitavuse kontrolli.');
  if ((story.criteria || []).some(ac => ac.accepted === false)) missing.push('Kõik kriteeriumid peavad olema kinnitatud.');
  if (story.openQuestions?.length) missing.push('Avatud küsimused peavad olema lahendatud.');
  const view = story.requiresMockup ?? /näha|vaada|otsida|filtreer|kuva|vorm|leht|pakett|treening|profiil/i.test(story.title);
  const mockup = story.mockups?.at(-1);
  if (view && !mockup?.components?.length) missing.push('Vaadet puudutaval lool peab olema mockup.');
  if (mockup && (story.criteria || []).some(ac => ac.mockupElementId && !mockup.components.some(c => c.id === ac.mockupElementId))) missing.push('Kriteeriumi seos mockup’i elemendiga puudub.');
  return { ready: missing.length === 0, missing };
}
