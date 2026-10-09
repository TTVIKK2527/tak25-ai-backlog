# Arhitektuur

## Valik ja teostuse piir

Valin veebirakenduse ning kihilise monoliidi: brauseri vaade, serveri API, rakendusloogika, andmehoidla adapter ja AI adapter. Väikese projekti üks server on lihtsam käivitada, testida ja jälgida kui mitu eraldi teenust.

Praeguses prototüübis ühendab server.js API ja suure osa rakendusloogikast; ai.js eraldab AI päringuid ning data/projects.json on failipõhine hoidla. Diagrammi kihid on vastutuste kavand, mitte väide, et kõik kihid on juba eraldi moodulites. Andmebaas ei ole praegu rakenduses: SQL-hoidla on tulevane asendus, kui samaaegne kasutus ja andmemaht seda nõuavad.

## Andmevoog

1. Brauser saadab HTTP JSON päringu Node.js API-le.
2. Server valideerib sisendi ja kutsub projekti/backlog'i loogikat.
3. Loogika loeb või muudab projekti andmehoidla kaudu; salvestamisel kasutatakse ajutist faili ja ümbernimetamist.
4. AI ettepaneku korral saadab server vajaliku projekti sisu AI adapteri kaudu Groq teenusele. API võti jääb serverisse. Teenusele saadetav sisu peab olema kasutajale teada; päris tundlikke kliendiandmeid ei kasutata demo jaoks.
5. Adapter ja server kontrollivad vastuse struktuuri. Brauser näitab eelvaadet; kasutaja kinnitus algatab eraldi salvestamise.
6. Groq vea või limiidi korral jääb käsitsi haldamine võimalikuks. AI tulemust ei võltsita.

## Eelised, puudused ja alternatiiv

Kihiline monoliit vähendab juurutus- ja suhtluskeerukust ning teeb kohaliku demo lihtsaks. Puudused: sama protsess jagab ressursse; failipõhine salvestus ei anna mitme serveri tehinguid ega head samaaegsete kirjutajate skaleerimist. Praegune prototüüp ei ole valmis avalikuks mitme kasutaja teenuseks: autentimine, projektipõhine autoriseerimine, TLS, piirangud ja taastamisproov tuleb enne sellist kasutust kavandada ning teostada.

Mikroteenused eraldaksid projektihalduse ja AI teenuse ning lubaksid neid sõltumatult skaleerida. Vastutasuks lisanduvad teenustevaheline autentimine, võrk, hajutatud jälgimine ja veakäsitlus. Väikese ühe arendaja projekti puhul ei õigusta see veel keerukust.

## Muutunud tingimused

Mobiiliklient kasutab sama serveri API-d; lisandub uus vaade, autentimise/turvalise sessiooni kavand ja mobiili testid. Lisan skeemile kliendi ning backlog'i mobiilse töövoo lood. SQL-hoidla ega AI adapterit ei dubleerita kliendis.

Sada korda rohkem kasutajaid: kõigepealt mõõdan päringuid, faililukke, mälu ja AI limiite. Kavandatud järgmine samm on tehingutega SQL-hoidla, AI tööde piiratud järjekord ja jälgitav limiidikäitumine. Mitme serveri korral on vaja jagatud hoidlat ja järjekorda. AI teenuse limiit ei kao pelgalt serverite lisamisega. Teenuste lahutamine tuleb alles mõõdetud vajaduse põhjal.
