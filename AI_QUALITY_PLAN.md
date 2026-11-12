# AI arenduse kvaliteediplaan — #311 ja #313

## Projekt ja valik

Valisin AGENTS.md, sest Codex tunneb seda projektijuhiste failina. Reeglid paiknevad projekti juurkaustas ja kirjeldavad tegelikke faile, käske ning andmepiire. Allikaks on avaliku tak25-ai-backlog repositooriumi muutumatu snapshot 44f89b30f2033789a7033e351781bf8bd4405c60. Koopia ei sisalda isiklikku .env-faili ega kliendiandmeid. Rakenduskoodi taastamisel ei muudetud.

## Uuritud allikad — 12.11.2026

1. [OpenAI: Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md). Codex loeb juhiseid enne tööd; asukoht määrab nende ulatuse ja alamkausta juhised võivad täpsustada üldiseid. Seepärast sisaldab juurfail siin projekti ühiseid piire. Globaalseid kasutajajuhiseid ei muudetud.
2. [OpenAI: Custom Code Review rules for Codex](https://developers.openai.com/blog/custom-code-review-rules-for-codex). Kitsad, põhjendatud invariandid aitavad sisulist ülevaatust; masinkontrollid sobivad deterministlikele nõuetele. Rakendasin valitud loo isoleerimise ja kinnitamise reeglid. Juhisefail ei asenda tehnilist kontrolli.
3. [OpenAI: Iterating Development Workflows with Codex](https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex). Soovituslikku töövoogu tuleb kohandada projektiga. Siin hoian plaani, kontrollid ja ausa tõendusmaterjali lahus; ei lisa põhjendamata keerulist töökorraldust.

Need on kolm eri ametlikku dokumenti samalt avaldajalt. Täiendavad tehnilised kaitsed allpool on selle projekti kavand, mitte väide nende allikate põhjal juba seadistatud GitHubi kontrollidest.

## Riskid ja kvaliteediväravad

| Risk | Juhis | Kontroll või vajalik tehniline tugi |
|---|---|---|
| AI muudab kinnitamata või vale lugu | Ettepanek eraldi; ainult valitud loo kinnitus | server.test.js kinnituse, kordusrakendamise ja undo kontroll; täiendav mitme loo isoleerimise test tulevase muudatusega |
| Vigane AI vastus või teenuse limiit | Valideeri skeem, aus veateade, ära võltsi tulemust | ai.test.js kontrollib vigast väljundit, kordust, puuduvat võtit ja kvoodiviga; päris teenust ei kutsuta |
| Kadunud andmed | Eraldi DATA_DIR testides; säilita undo | server.test.js kontrollib restarti ja varasema seisu taastamist; samaaegsete kirjutajate koormust see ei tõenda |
| Saladuste või kliendiinfo avaldamine | Võti serveris, synthetic testandmed, diff'i ülevaatus | .gitignore ja avaldamiseelne failide kontroll; need ei tuvasta kõiki võimalikke saladusi |
| Katkine kood põhiharus | Feature branch, väike PR, testid ja review | GitHubi nõutud kontrollid ja kaitsed vajavad eraldi seadistust; neid pole siin muudetud |
| Liiga suur muudatus | Piira seotud failidele, põhjenda ulatust | Diff'i ja PR ülevaatus; failide arv üksi ei tõenda ohutust |

## Tegelikud käsud ja tulemus

npm test käivitab üheksa testi. 12.11.2026 lubatud loopback-keskkonnas läbisid kõik 9, ebaõnnestunuid 0, väljumiskood 0. Toorväljund: QUALITY_EVIDENCE.txt. Node'i versioon oli 25.8.0. Enne võrguõiguse saamist takistas serverit listen EPERM; seda esimest jooksu ei loeta edukaks.

Kõigi JavaScripti failide node --check väljund on QUALITY_EVIDENCE.txt. Projektil pole lint-, build- ega tüübikontrolli skripti, mistõttu nende läbimist ei väideta. Uusi sõltuvusi pole vaja. Päris Groq teenuse, täieliku brauseritöövoo ega eestikeelse väljundi kvaliteet ei ole nende offline-testide tõend.

## Tehniliste kaitsete plaan

Enne järgmise koodimuudatuse ühendamist lisada eraldi heakskiidetud PR-is CI, mis kasutab toetatud Node'i versiooni ja käivitab npm test ning süntaksikontrolli. Repositooriumi haldaja peaks määrama selle kontrolli nõutuks, kaitsma tegelikku master-põhiharu ja nõudma asjakohast ülevaatust. Reeglid üksi push'i ei blokeeri. Konto kaitseid ega õigusi selles töös ei muudeta.

Vana vea parandamisel kirjuta esmalt regressioonitest, jälgi selle ebaõnnestumist vana koodiga ja edu parandusega ning käivita kogu suite. Säilita olemasolevad testid. Korduvast veast lisa siia lühike sümptom, põhjus ja testi viide; ära talleta kliendiandmeid.

## Esitamise seis

Reeglifail ja kvaliteediplaan on AI koostatud. Isiklik enesehinnang vajab õpilase 5–10 enda lauset; küsimused on STUDENT_REFLECTION.md failis. #311 ja #313 tuleb esitada eraldi. Materjali avaldamine ei tähenda isikliku enesehinnangu valmimist, Kriidi esituse kinnitamist ega õpetaja aktsepteerimist. Need sammud tuleb jälgida eraldi.
