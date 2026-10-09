# Git ja SemVer

Põhimõtete allikas: [Semantic Versioning 2.0.0](https://semver.org/).

Git salvestab iga sisulise kavandimuudatuse koos arusaadava sõnumiga. Haru võimaldab muuta skeemi või ulatust põhitööd mõjutamata; ülevaatuse järel ühendatakse muudatus põhiharusse. Varasemate tööde kuupäevi ega commit'e ei kirjutata ümber #321 ajaloo tekitamiseks.

Planeeritud dokumentatsiooni etapid: eesmärk ja elutsükkel; lood ning periood; arhitektuur ja muudetav skeem; CASE-võrdlus; versiooniplaan ja kaitsmise kontroll. Iga etapi tegelik muudatus salvestatakse eraldi; commit'ide arv kinnitatakse Git-logist, mitte dokumendi väitest.

SemVer MAJOR.MINOR.PATCH rakendub defineeritud avalikule API-le: projekti HTTP JSON leping ja ekspordiformaat. Kavandamise dokumentatsioon järgib sama väljalaske märget, kuid kirjavea parandamine dokumentatsioonis ei nõua iseenesest rakenduse uut versiooni.

| Muudatus versioonist 2.4.1 | Järgmine versioon | Põhjus |
|---|---|---|
| Salvestamise vea parandus, leping sama | 2.4.2 | PATCH |
| Uus valikuline eksport, olemasolevad kliendid töötavad | 2.5.0 | MINOR; PATCH lähtestub |
| Kohustuslik välja ümbernimetamine API-s | 3.0.0 | MAJOR; MINOR ja PATCH lähtestuvad |

Kavandatud tee: 0.1.0 käsitsi piloot, 0.2.0 juhitud AI töövoog, 0.3.0 kriteeriumid ja kinnitatav täpsustus, 1.0.0 kokkulepitud stabiilne API ning kontrollitud esimene väljalase. Need pole väited juba avaldatud versioonidest. 0.x API ei ole veel stabiilne; muudatused dokumenteeritakse selgelt.

Väljalaske eel käivitatakse testid, kontrollitakse dokumentatsiooni ja andmete taastamist, kirjutatakse muudatuste loend ning märgitakse tegelik commit Git-tagiga. Kasutuselevõtul kontrollitakse konfiguratsiooni ja käivitust; eelmisele versioonile tagasipööramine peab arvestama andmeformaadi muutusi, mitte ainult lähtekoodi.
