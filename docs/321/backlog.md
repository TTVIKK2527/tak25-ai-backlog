# Kavandatud arendustööde nimekiri

See tabel kavandab arendust algusest. Olemasoleva rakenduse funktsioonid ei tähenda, et siin kirjeldatud periood või kliendikinnitus on päriselt toimunud. Prioriteet P0 on esimeseks kasutatavaks versiooniks vajalik, P1 järgmine ja P2 valikuline. ID-d seovad lood töövahendi kirjetega.

| ID | Prioriteet | Kasutajalugu | Vastuvõtukriteeriumid | Sõltuvus |
|---|---|---|---|---|
| PLAN-01 | P0 | Projektijuhina soovin projekti luua ja uuesti avada, et nõuded jääksid alles. | Tühi nimi lükatakse tagasi; salvestatud projekt taastub pärast serveri restarti. | Puudub |
| PLAN-02 | P0 | Projektijuhina soovin lugusid käsitsi hallata, et AI teenuse puudumine tööd ei peataks. | Loo lisamine, muutmine ja eemaldamine püsivad; järjestus taastub avamisel. | 01 |
| PLAN-03 | P0 | Projektijuhina soovin prioriteete ja MVP piiri muuta, et valida esimese väljalaske ulatus. | Järjestus ja piir on salvestatud; eksport näitab sama piiri. | 02 |
| PLAN-04 | P0 | Projektijuhina soovin ideele täpsustavaid küsimusi, et ebaselged nõuded saaksid selgemaks. | Küsimusele saab vastata valikuga või vabatekstiga; teenuse veal kuvatakse aus veateade. | 01, 02 |
| PLAN-05 | P0 | Projektijuhina soovin AI lugusid üle vaadata ja valida, et backlog'i läheks ainult sobiv töö. | Vähemalt viis roll-tegevus-kasu ettepanekut; valimata lood ei lisandu; vigane vastus lükatakse tagasi. | 04 |
| PLAN-06 | P0 | Projektijuhina soovin loole kriteeriume ja mockup'i, et klient saaks tulemust hinnata. | Vähemalt kolm kontrollitavat kriteeriumi; käsitsi muudatus säilib; mockup ei käivita suvalist skripti. | 05 |
| PLAN-07 | P0 | Projektijuhina soovin kliendi täpsustuse eelvaadet, et kinnitaksin muudatuse teadlikult. | Enne/pärast nähtav; rakendub ainult kinnitusega ja ainult valitud loole. | 06 |
| PLAN-08 | P1 | Projektijuhina soovin tagasi võtta viimase muudatuse, et parandada ekslikku otsust. | Taastub eelmine seis; tühja ajaloo korral selge teade. | 02 |
| PLAN-09 | P1 | Projektijuhina soovin valmisoleku kontrolli, et puudulikku lugu arendusse ei saadetaks. | Puuduva kriteeriumi või avatud küsimusega loo valmisolek blokeeritakse. | 06 |
| PLAN-10 | P1 | Arendajana soovin Markdown eksporti, et nõuded saaksid meeskonnale üle antud. | Lood, kriteeriumid ja MVP piir vastavad salvestatud seisule. | 03, 06 |
| PLAN-11 | P2 | Projektijuhina soovin grooming'u ettepanekuid, et märgata liiga suuri või kattuvaid lugusid. | Põhjus ja ettepanek nähtavad; muudatus ainult kinnitusega. | 07 |

## Esimene arendusperiood: viis tööpäeva

Eesmärk: käsitsi loodud projekt ja prioritiseeritud backlog säilivad ning AI puudumisel ei kao töö. Tegemist on kavandatud perioodiga, mitte fiktiivse ajalooga.

- Päev 1: PLAN-01, sisendivalideerimine ja salvestamise testid.
- Päev 2: PLAN-02, CRUD, järjestus ja püsivuse kontroll.
- Päev 3: PLAN-03, MVP piir, projekti sisemine järjekord.
- Päev 4: PLAN-04 teenuseliidese prototüüp, vea- ja limiidikäitumine; võtit hoitakse serveris.
- Päev 5: korduskontroll, dokumentatsioon, demo ja järgmiste tööde prioriseerimine. PLAN-05 algab ainult siis, kui perioodi eesmärk on tõendatud.

Kui aega jääb poole vähem, säilivad 01-03 ja kontrollid; AI prototüüp liigub järgmisse perioodi. See on vähendatud käsitsi piloot, mitte algse täieliku AI töövoo valminud MVP. Teste ja turvalisust ei eemaldata ulatuse vähendamiseks.

## Tööde haldamise keskkond

Keskkond on olemasoleva repositooriumi [GitHub Issues](https://github.com/TTVIKK2527/tak25-ai-backlog/issues?q=is%3Aissue+%5B321%5D). 9. oktoobril 2026 loodi ja kontrolliti 11 avatud kavandatud tööd. Iga kirje sisaldab kasutajalugu, vastuvõtukriteeriume, prioriteeti, olekut ja sõltuvuste PLAN-ID-sid. Avatud kirje ei tähenda lõpetatud arendust.

| Plaan | Tegelik töökirje |
|---|---|
| PLAN-01 | [#1](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/1) |
| PLAN-02 | [#2](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/2) |
| PLAN-03 | [#3](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/3) |
| PLAN-04 | [#4](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/4) |
| PLAN-05 | [#5](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/5) |
| PLAN-06 | [#6](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/6) |
| PLAN-07 | [#7](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/7) |
| PLAN-08 | [#8](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/8) |
| PLAN-09 | [#9](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/9) |
| PLAN-10 | [#10](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/10) |
| PLAN-11 | [#11](https://github.com/TTVIKK2527/tak25-ai-backlog/issues/11) |
