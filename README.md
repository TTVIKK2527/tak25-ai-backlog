# TAK25 AI Backlog

Veebirakendus, mis aitab projektijuhil muuta kliendi ebamäärase idee juhitud vestluse abil kasutajalugudeks, vastuvõtukriteeriumideks ja mockup'ideks.

## Käivitamine

1. Paigalda Node.js 22 või uuem.
2. Loo tasuta Groq konto ja võti aadressil https://console.groq.com/keys. Kasuta Free plaani.
3. Kopeeri `.env.example` failiks `.env` ja määra `GROQ_API_KEY`. Server loeb faili automaatselt; võtit ei saadeta brauserisse.
4. Käivita rakendus:

```bash
npm start
```

5. Ava terminalis näidatud aadress (vaikimisi `http://localhost:3000`; selle töökausta `.env` kasutab porti 3011).

Rakendus kasutab failipõhist püsisalvestust failis `data/projects.json`. Andmed jäävad alles ka pärast serveri taaskäivitamist.

## Mis töötab

- Projektide loomine, loend ja uuesti avamine.
- Juhitud vestlus ühest vabatekstilisest ideest.
- Täpsustavad küsimused vastusevariantidega ja vaba teksti võimalusega.
- Rollide valimine ja happy path'i järjekorras AI pakutud kasutajalood.
- Lugude lisamine backlog'i valikutega.
- Prioriteedi soovitus ja loo valimine.
- Vastuvõtukriteeriumide ja mockup'i loomine valitud loole.
- Kriteeriumide muutmine, eemaldamine ja kontrollitavuse hoiatused.
- Kliendi täpsustuse põhjal enne ja pärast eelvaade.
- Muudatuse rakendamine ainult valitud loole.
- Backlog'i käsitsi lisamine, muutmine, kustutamine, järjestamine ja MVP joon.
- Definition of Ready kontroll staatusele "Valmis arenduseks".
- Viimase muudatuse tagasivõtmine.
- AI grooming ülevaatus ning probleemide rakendamine kinnitusega.
- Markdown eksport.

## Päris AI

Kõik sisulised AI ettepanekud tulevad Groq API-st mudeliga `openai/gpt-oss-120b`. Mudelit saab muuta muutujaga `GROQ_MODEL`. Rakendus saadab iga päringuga projekti hetkeseisu ning kasutaja valikud ja vabateksti. Kasutatakse ranget JSON-skeemi ja serveripoolset lisakontrolli. Vigase vastuse korral tehakse üks korduskatse. Puuduva võtme või teenuse vea korral näidatakse veateadet; käsitsi backlog’i haldus töötab ning võlts-AI fallback puudub.

Groq tasuta plaanil on päringu- ja tokenilimiidid; kontrolli oma konto limiite aadressil https://console.groq.com/docs/rate-limits. Täpsed limiidid võivad muutuda. Päringud edastavad projekti sisu teenusepakkujale.

Käivita kontrollid: `npm test`. Need kontrollivad transpordi valideerimist ja isoleeritud serveri käsitsi töövoogu, sealhulgas serveri taaskäivitamist. Päris mudeli kontroll: käivita eraldi server, nt `PORT=3012 DATA_DIR=/tmp/tak25-live-verification npm start`, ning teises terminalis `node scripts/live-check.js`. See kasutab päris API-d ja tasuta limiite, loob testprojekti ainult eraldi andmekataloogi ning kirjutab tulemused faili `outputs/live-verification.md`.

## Piirangud ja esitamine

- Päris mudeli väljundid on eestikeelsed; vormi ja kriteeriume valideeritakse. Keeleline või sisuline sobivus vajab endiselt kliendi kinnitust.
- Käsitsi jagamine ja ühendamine näitavad enne rakendamist eelvaadet; jagamisel tuleb kriteeriumide jaotus üle kontrollida.
- Kohalik Git-repositoorium sisaldab tegelike muudatuste commit’e. API võti ja salvestatud projektid on ignoreeritud. Kaughoidlasse avaldamine jääb esitajale.
- Drag-and-drop asemel on backlog'i järjestamiseks üles ja alla nupud.
- Jira ja GitHub Issues eksport, jagatav kliendilink ning kõnesisend on lisavõimalustena kirjeldatud, kuid pole MVP-s teostatud.

## AI piirangud

- AI võib pakkuda liiga üldiseid või liiga suuri lugusid, mistõttu on lisatud grooming ülevaatus.
- Vastuvõtukriteeriumid vajavad inimese kinnitust; rakendus hoiatab hinnanguliste sõnade ja mitme tingimuse eest.
- Grooming kontrollib viit probleemikategooriat ning näitab korraga ühte olulisemat ettepanekut. Ülevaatust saab korrata.
- Tasuta limiit võib aeglustada tihedat demonstratsiooni. Lühikese `retry-after` korral ootab server ühe korra automaatselt; muidu näitab veateadet. Käsitsi töö jääb võimalikuks.
- Vestluse ajalugu ei ole ainus andmeallikas: server saadab ja kasutab projekti tegelikku backlog'i seisu.

## Turvalisus

- AI võti peab jääma serveri keskkonnamuutujasse ega kuulu lähtekoodi.
- Kõik AI päringud käivad serveri kaudu.
- Mockup kuvatakse rakenduse enda komponentidest JSON-struktuuri põhjal, mitte suvalise brauseris käivitatava HTML või skriptina.

## Esituse materjalid

- Kasutusstsenaarium: `docs/scenario.md`
- Arendustöö backlog ja MVP põhjendus: `docs/development-backlog.md`
- Korduskontroll: `outputs/assignment-audit.md`
- Demonstratsiooni kava: `outputs/demo-guide.md`
