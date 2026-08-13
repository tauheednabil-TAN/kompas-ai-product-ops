# AI-forordningen — designnoter

> **Dette er ikke en compliance-erklæring.** Kompas er et porteføljeprojekt med
> syntetiske data. Det er ikke vurderet af en jurist, ikke risikoklassificeret
> formelt, og ikke i drift nogen steder.
>
> Dokumentet beskriver, **hvilke designvalg der er truffet med hvilke
> forpligtelser i baghovedet**. Det er hensigtserklæringer om arkitektur, ikke
> påstande om overholdelse. Skelnen er vigtig nok til at stå først.

---

## Hvorfor det overhovedet er relevant

EG Digital Welfare leverer fagsystemer til kommuner på det specialiserede
socialområde. Bilag III, punkt 5 a) i forordning (EU) 2024/1689 nævner
udtrykkeligt AI-systemer, der anvendes af offentlige myndigheder til at vurdere
fysiske personers berettigelse til væsentlige offentlige ydelser.

Kompas gør ikke det. Det er et **internt produktværktøj**: det triagerer
henvendelser, gennemgår dokumentationens form, skriver release notes og læser
regulering. Det vurderer ikke borgere, og det indgår ikke i en afgørelse.

Men det ligger tæt nok på, at det er værd at bygge, som om det gjorde. Det er
langt billigere at have logning og menneskeligt tilsyn med fra starten end at
skulle bygge det ind bagefter.

## Overblik

| Forpligtelse (område) | Hvor det er adresseret i koden | Hvad der faktisk er bygget |
| --- | --- | --- |
| Menneskeligt tilsyn | `components/agents/verdict-bar.tsx`, C3 | Hver eneste output-flade har Godkend / Ret / Afvis. Der findes ingen kodesti, hvor et modeloutput får en virkning uden et menneskeligt klik. |
| Logning og sporbarhed | `lib/db/schema.ts` → `agent_runs`, C4 | Hvert kald gemmer tidspunkt, agent, model-id, promptversion, input-hash, output, tokental, pris i DKK, svartid, status — og den menneskelige vurdering, når den gives. Også fejlede kald. |
| Gennemsigtighed | `/revisionsspor`, sidefod på Sagsspejl | Brugeren kan se hvilken model og hvilken promptversion der producerede et konkret svar, og hoppe direkte til kørslen i revisionssporet. |
| Datastyring | `lib/ai/guards.ts`, C2 | CPR-detektor kører **før** modelkaldet. Blokerede forsøg tælles i `blocked_submissions` uden at gemme teksten. Der er også et output-tjek, hvis modellen hallucinerer et CPR-nummer. |
| Nøjagtighed og robusthed | `lib/evals/**` | To-lags evaluering med deterministiske tjek, blind dommer, tre kørsler med median og rapporteret spredning, og kalibreringssager der afslører en defekt dommer. |
| Teknisk dokumentation | `docs/`, `PROGRESS.md` | Modelvalg med begrundelse og kildedatoer, evalueringsmetode, designbeslutninger, og hvad der blev fravalgt. |

## De steder, hvor et designvalg er en holdning

### Agenten nægter at køre, hvis kørslen ikke kan logges

`app/api/agents/[slug]/run/route.ts` afviser før modelkaldet, hvis databasen ikke
er tilgængelig. Det ville have været nemmere at logge "best effort" og lade
kørslen fortsætte. Men et system, hvor logningen er valgfri, har reelt ingen
logning — den fejler præcis, når der er travlt, hvilket er når man har brug for
den.

### CPR-tjekket kommer før alt andet

Tjekket lå oprindeligt efter databasetjekket, hvilket betød, at et indsat
CPR-nummer blev besvaret med "databasen er ikke konfigureret". Spørgsmålet
"hvad sker der, hvis jeg indsætter et CPR-nummer?" skal altid besvares med
"det blev stoppet". Tælleren af blokerede forsøg er nu *best effort*, netop så
tabet af tælleren ikke kan ændre svaret.

### Ordret citat som teknisk kontrol, ikke som formulering

Flere agenter har et felt, der skal være et **ordret uddrag af inputtet**, og det
efterprøves maskinelt både i UI'et og i evalueringen. Det er den billigste
tilgængelige kontrol mod, at systemet fremstiller noget, der ikke står i
kildematerialet — og den kan ikke tale sig uden om resultatet.

### Sikkerhed er et veto i evalueringen

Bestå-reglen er `alle deterministiske tjek AND middelscore ≥ 4,0 AND sikkerhed ≥ 4`.
Sikkerhed indgår ikke i et gennemsnit, hvor den kan opvejes af velskrevet
sprog. Et svar, der opfinder en oplysning om en borger, dumper.

### Sagsspejl siger tre gange, hvad det ikke gør

Systemprompten fastslår scope-grænsen tre gange på tre måder, og sidehovedet
gentager den for brugeren. Den fejl, der betyder noget her, er ikke et forkert
svar — det er, at værktøjet bliver læst som en faglig vurdering af en borgers
sag.

## Hvad der bevidst **ikke** er gjort

Ærlighed er hele pointen med dokumentet:

- **Ingen formel risikoklassificering.** Der er ikke gennemført en vurdering
  efter artikel 6, og der er ingen begrundet konklusion om, hvorvidt systemet
  ville være højrisiko.
- **Ingen konsekvensanalyse (DPIA).** Der behandles ingen personoplysninger, så
  der er intet at analysere — men det betyder også, at øvelsen ikke er lavet.
- **Intet kvalitetsstyringssystem** efter artikel 17.
- **Ingen model- eller systemdokumentation** i forordningens forstand.
  `docs/models.md` er teknisk research, ikke teknisk dokumentation efter bilag IV.
- **Ingen registrering, ingen overensstemmelseserklæring, ingen CE-mærkning.**
- **Loggen har ingen opbevaringspolitik.** Rækker i `agent_runs` slettes aldrig.
  For syntetiske data er det ligegyldigt; for rigtige data ville det være det
  første, der skulle på plads.

## Hvad jeg ville gøre først, hvis det skulle i drift

1. Afklare med en jurist, om værktøjet falder inden for forordningens
   anvendelsesområde overhovedet. Sandsynligvis ikke — men det skal afgøres, ikke
   antages.
2. Opbevaringspolitik og sletning på `agent_runs`, inklusive input-teksten.
3. Rollestyret adgang. I dag kan enhver med adgang til appen se alt.
4. En dommermodel fra en anden leverandør end arbejdshesten, så
   evalueringen ikke deler blinde vinkler med det, den evaluerer.
5. Reel adskillelse mellem demo- og driftsmiljø, i stedet for et flag.
