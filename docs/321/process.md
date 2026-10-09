# Arendusprotsess ja metoodika

## Elutsükkel

| Etapp | Eesmärk ja väljund | Kontroll |
|---|---|---|
| Idee ja probleem | Selgitada, kelle nõuete täpsustamine aeglane on; ühe lehe eesmärk ja piirid | Projektijuht kinnitab probleemi; päris intervjuu alles kavandatud |
| Nõuded | Rollid, kasutajalood, prioriteedid ja vastuvõtukriteeriumid | Iga lugu sisaldab nähtavat tulemust; oletused märgistatud |
| Kavandamine | Arhitektuur, andmevoog, mockup ja riskid | Diagrammi ja lugude ühine ülevaatus |
| Iteratiivne teostus | Väikesed töötavad funktsioonid ja sisulised Git-muudatused | Loo kriteeriumid, testid, ülevaatus |
| Testimine | Vigased sisendid, AI teenuse vead, salvestamine ja taastamine | Isoleeritud automaattestid ja käsitsi kontroll |
| Kasutuselevõtt | Konfiguratsioon, varundus, versioon ja tagasipööramine | Keskkonnamuutujad, käivitusproov, taastamisproov |
| Hooldus | Vigade parandamine, sõltuvuste ülevaatus ja uued nõuded | Veateated backlog'i; regulaarsed väikesed väljalasked |

## Mudelite võrdlus

Koskmudel planeerib nõuded, kavandi, teostuse ja testimise suuremate järjestikuste etappidena. See sobib hästi fikseeritud nõuete ja ametlike etappide korral, kuid hiline muudatus võib nõuda mitme kinnitatud dokumendi ja teostuse ümbertegemist.

Iteratiivne mudel kordab nõuete, kavandi, teostuse ja testimise tsüklit väikeste osadena. Varajane töötav näide aitab leida vale arusaama, kuid nõuab ulatuse teadlikku piiramist, et projekt ei kasvaks lõputult.

Valin iteratiivse mudeli: kliendi vabatekst ja AI ettepanekud vajavad katsetamist ning kasutaja tagasiside võib muuta töövoogu. Esmalt valideerin käsitsi loomise ja salvestamise, seejärel AI-küsimused ja kriteeriumid. Turvalisust ning testimist ei lükata viimasesse etappi.

## Kanban

Ühe arendaja väikese projekti jaoks valin Kanbani: töö liigub olekutes Kavandatud -> Valmis alustamiseks -> Töös -> Kontrollimisel -> Valmis. Töös piir on üks lugu; kontrollimisel üks. Uus töö ei lähe töösse enne eelmise kontrollimist. Blokeeritud töö jääb nähtavale koos põhjuse ja järgmise sammuga.

Scrum kasutab kindla pikkusega sprinte, eesmärke, rolle ja sündmusi. Kanban keskendub töövoole ning poolelioleva töö piiramisele. Üksi ei väida ma, et täidan päris Scrum-meeskonna rolle või kohtumisi. Kanban sobib muutuvate AI- ja teenuselimiitidega töödeks; puudus on see, et ilma teadliku perioodieesmärgita võivad tähtajad hajuda.

Valmis alustamiseks: roll, vajadus, kasu, prioriteet, kontrollitavad kriteeriumid ja sõltuvused on selged. Valmis: kriteeriumid kontrollitud, asjakohased testid läbitud, dokumentatsioon ajakohane, muudatus üle vaadatud. Kliendi nõusolekut märgitakse ainult päris tagasiside alusel.

## Nõuete muudatus

Salvestan uue nõude eraldi tööna koos põhjusega. Hindan mõju lugudele, skeemile, andmetele, turvalisusele ja testidele. Võrdlen väärtust olemasolevate prioriteetidega; otsustan tellijaga, mis asendatakse või milline tähtaeg muutub. Käimasolevat tööd ei katkestata automaatselt. Muudan diagrammi ja perioodiplaani, salvestan Git-is ning kontrollin mõjutatud käitumist. Päris tellija otsust ei asendata väljamõeldud kinnitusega.
