# Algse ülesande korduskontroll

## Parandatud selle kontrolli käigus

- Päris Groq mudel: domeenipõhised küsimused, rollid, lood, prioriteet, kriteeriumid, mockup, täpsustused ja grooming.
- Valitud vastused ja vabatekst jõuavad mudelini koos tegeliku backlog’iga.
- JSON-skeem, korduskatse ja arusaadav teenuse/limiidi veateade; võti jääb serverisse.
- Kriteeriumide ja mockup’i ettepanek ei muuda lugu enne kinnitust.
- Valitud kriteeriume saab eelvaates muuta ja tagasi lükata.
- Täpsustus muudab ainult valitud lugu; vahepealse käsitsi muudatuse korral nõutakse uut ettepanekut.
- Grooming näitab konkreetseid asenduslugusid ja jaotatud kriteeriume enne rakendamist.
- Etapi muutus salvestatakse. Vabatekst on saadaval kogu protsessi jooksul.
- Uue vaate prompt loob loo, kriteeriumid ja mockup’i ühe kinnitatava ettepanekuna.
- Mockup’i ajalugu säilib; varasema versiooni taastamine loob uue versiooni.
- Versiooniga seotud kriteeriumid taastatakse koos mockup’iga. Ajaloovalik kuvab kohe valitud versiooni.
- DoR kontroll kehtib ka käsitsi backlog’i salvestamisel; kinnitamata kriteeriumid takistavad valmisolekut.
- Failisalvestus kasutab atomaarset asendamist; API toimingud on järjestatud, et vältida kaotatud muudatusi.
- AI kasutab ülesandepõhiseid JSON-skeeme ja lühemaid prompte. Rolli -na vorm ning viis disainikriteeriumi on valideeritud.
- Kriteeriumi tingimuslik koma ei põhjusta enam ekslikku hoiatust. Server ja brauser kasutavad sama kontrolli.
- Rollide lisamine/eemaldamine, ettepaneku käsitsi muutmine, uue vaate eraldi tunnus ja projektivormi elutsükkel on parandatud.
- Arendustöö backlog’i MVP joon sisaldab nüüd kliendi täpsustust, nagu ülesanne nõuab.

## Juba olemas

Projektide loend, püsiv backlog ja vestlus, Connextra osad, suurus, staatus, päritolu, järjestamine, MVP joon, tagasivõtmine, Markdown eksport, kasutusstsenaarium ja oma arendustöö backlog.

## Kontrollitud

- Päris Groq võtmega: rolliküsimus, makseküsimus, vähemalt viis eestikeelset põhitöövoo lugu ja valitud lugude lisamine. Need algussammud kontrolliti enne hilisemat jätkukontrolli.
- Päris Groq jätkukontroll: põhjendatud prioriteet, viis kriteeriumi ja mockup, ühe kriteeriumi tagasilükkamine, ühe muutmine, käibemaksu täpsustus, muutuste isoleerimine, liiga suure loo jagamine, DoR tõke ja uuesti avamine. Tulemused: `live-verification.md`.
- Päris Groq uue-vaate kontroll: uus tunnus, lugu koos kriteeriumide/mockup’iga ja valitud loo säilimine.
- Üheksa automaattesti: AI transpordi ja vigaste vastuste kontroll, korduva rolliküsimuse tõrje, kriteeriumide kontroll ning võtmeta käsitsi töövoog koos serveri taaskäivitamisega.
- Päris Groq: semantiline ühendamine, subjektiivne kriteerium, puuduvad kriteeriumid, puuduv mockup ja vigane pealkiri. Kõik viis kontrolli läbisid; tulemused: `grooming-verification.md`.
- Brauseris: projekti loomine, käsitsi loo lisamine, ajaloolise mockup’i kuvamine ning 390 px mobiilivaade ilma horisontaalse ülejooksuta.

## Piirangud ja esitamine

- Käsitsi jagamise/ühendamise eelvaated ja groomingu Ignoreeri valiku püsisalvestus on lisatud. Jagamisel jaotatakse kriteeriumid kahe loo vahel; inimene peab sobivuse üle kontrollima.
- AI võib endiselt pakkuda kohmakaid sõnastusi või sisuliselt liiga üldiseid kriteeriume. Skeemi ja elemendiviite kontroll ei tõesta visuaalset/sisulist sobivust; kliendi ülevaatus jääb vajalikuks.
- Tasuta Groq tokenilimiiti tabati päris testides. Lühikese cooldown’i korral tehakse üks automaatne kordus; muidu kuvatakse arusaadav viga. Grooming esitab korraga ühe olulisema leiu.
- Testimine oli API-põhine koos sihitud brauserikontrolliga, mitte kõigi õpetaja sammude üks katkematu brauserisalvestus.
- Git-repositoorium koos sisuliste commit’idega esitatakse GitHubi kontole TTVIKK2527. Salajane `.env` ja projektiandmed on välistatud; `.env.example` sisaldab tühja võtme välja. 5–10 minuti demonstratsiooni läbiviimine jääb esitajale; kava: `demo-guide.md`.
- CSV/Jira eksport, jagatav kliendilink, story map ja kõnesisend on vabatahtlikud lisad.
