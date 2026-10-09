# Individuaalse kaitsmise harjutus

See on harjutuskava, mitte sooritatud kaitsmine ega õppija enda kogemuse kirjeldus. Harjuta selgitamist oma sõnadega ning päris töövahendi muutmist ilma valmis vastuse ettelugemiseta.

## Viie minuti seletus

Näita eesmärki, selgita iteratiivse mudeli ja Kanbani valikut, vali üks P0 lugu ning jälgi selle andmevoogu brauserist hoidlani. Selgita, miks AI võti jääb serverisse ja miks AI ettepanek vajab kinnitust. Erista praegust failipõhist prototüüpi tulevasest SQL-hoidlast.

## Kümne minuti muudatus

Vali üks olukord juhuslikult:

1. Mobiiliklient: lisa diagrams.net-is uus klient ja API ühendus. Loo töövahendis kaks uut lugu ning põhjenda korduskasutust ja turvalisust.
2. Pool tähtaega: muuda päris töökirjete prioriteete; jäta 01-03 esimesse pilooti ja põhjenda AI edasilükkamist. Testimist ei eemaldata.
3. Sada korda rohkem kasutajaid: nimeta mõõdetavad pudelikaelad, muuda hoidla skeemil SQL-hoidlaks ning lisa piiratud AI järjekord. Loo mõõtmise ja migratsiooni lood; ära väida, et teenuse limiit on serverite arvuga lahendatud.

Pärast muudatust salvesta skeem, vaata Git-erinevust ja selgita, milliseid teste või riske muudatus mõjutab. Õpetaja võib anda teistsuguse nõude; õpi põhjendamise käiku, mitte ainult neid näiteid.

## Teadmiste kontroll

- Kosk: järjestikused suuremad etapid; iteratsioon: korduvad väikesed tsüklid ning varasem tagasiside.
- Scrum: ajaliselt piiritletud sprindid ja rollid; Kanban: töövoog ja poolelioleva töö piir.
- CASE: aitab kavandit koostada ja muuta; ei tõenda automaatselt õiget rakendust.
- Monoliit: ühine juurutus; mikroteenused: sõltumatu juurutus koos hajutatud süsteemi lisakuluga.
- Haru: eraldi muudatuse kontroll ja ülevaatus enne ühendamist.
- 2.4.1: veaparandus 2.4.2, tagasiühilduv uus funktsioon 2.5.0, lõhkuv API muudatus 3.0.0.

Kirjalik kavand, avaldamine, Kriidi esitamine ja õpetaja vastuvõtmine on eraldi seisud. Kõik neli õpiväljundit tuleb kaitsmisel eraldi tõendada.
