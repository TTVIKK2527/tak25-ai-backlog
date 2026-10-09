# CASE-vahendid ja kasutamise tõend

## Valitud töövahendid

diagrams.net toetab komponentide, ühenduste ja andmevoo visuaalset kavandamist. Selle projekti muudetav lähtefail on architecture.drawio. GitHub Issues toetab tööde prioriseerimist, sõltuvuste arutelu ja edenemise jälgimist; Git hoiab dokumentide ja skeemi muudatuste tegelikku ajalugu.

## Võrdlus

| Kriteerium | diagrams.net | PlantUML |
|---|---|---|
| Sisend | Visuaalselt muudetavad objektid ja ühendused | Tekstiline diagrammi kirjeldus |
| Kiire kaitsmise muudatus | Lisada kast ja ühendus otse lõuendile | Muuta teksti ja renderdada uuesti |
| Git-ülevaatus | XML-i muutus võib olla visuaalsest muudatusest raskemini loetav | Tekstiline erinevus enamasti selgem |
| Sobivus sellele tööle | Väike komponentide skeem ja otsene ekraanil muutmine | Suurem ühtse märgistusega UML-kogum |
| Puudus | Paigutuse käsitsi korrashoid; skeem ei kontrolli rakenduse käitumist | Süntaksi õppimine ja renderdusvajadus; teksti õigsus ei tõenda kavandi sobivust |

Valin diagrams.net-i, sest kaitsmisel peab saama väikest arhitektuuriskeemi kiiresti muuta. GitHubi töökirjed näitavad, kuidas skeemimuudatusest saavad prioriseeritud arendustegevused. Kumbki vahend ei kinnita automaatselt nõuete või arhitektuuri õigsust.

## Päris kasutamise kontroll

- Avada architecture.drawio diagrams.net-is, kontrollida komponentide ja ühenduste nähtavust ning teha ja tagasi võtta proovimuudatus.
- Luua PLAN-01 kuni PLAN-11 tegelikud töökirjed lubatud repositooriumis; kontrollida prioriteete ja sõltuvusi.
- Kontrollida, et õpetaja saab avada dokumendid, skeemi lähtefaili ja tööde keskkonna.

9. oktoobril 2026 kasutati diagrams.net-i XML-lähteeditorit: skeem rakendati, ühenduste sildid kontrolliti ning AI adapter ja väline teenus nihutati paremale, et ühenduse tekst kastidega ei kattuks. Parandatud lähtefail on samas kaustas. GitHubis loodi kõik 11 kavandatud töökirjet ja kontrolliti nende avatud olekut; [lingid](backlog.md#tööde-haldamise-keskkond) on lisatud. Proovimuudatuse tagasivõtmist ja õpilase iseseisvat vahendikasutust kaitsmisel ei väideta tehtuks.

## Ametlikud allikad

- [diagrams.net failivormingud](https://www.drawio.com/docs/manual/editor/save-file-formats/)
- [PlantUML tekstipõhine diagramm](https://plantuml.com/starting)
- [GitHub Issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues)
