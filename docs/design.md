# Designsystem — som bygget

Målet er **et velbygget instrument**. Roligt, tæt hvor det skal være, luftigt hvor
det skal være. Attraktivt gennem proportion og tilbageholdenhed, aldrig gennem
udsmykning. Et værktøj, en dansk offentligt ansat skal kunne stole på ved første
øjekast.

Tokens ligger i `app/globals.css`. Komponenterne ligger i `components/ui/` og er
skrevet direkte mod de tokens.

---

## 1. Hvorfor ikke shadcn/ui-CLI'en

Arkitekturen lagde op til shadcn/ui. Komponenterne her bruger **Radix-primitiver
direkte** i stedet, og styles er skrevet i hånden mod projektets egne tokens.

Grunden: `shadcn init` skriver sit eget tokensystem ind i `globals.css`
(`--background`, `--foreground`, oklch-værdier, egen radius-skala). Det ville
konkurrere med §4-paletten, og hver eneste komponent skulle alligevel strippes for
skygger, afrundinger og vægte, der bryder designsystemet. Radix giver den del, der
faktisk er svær — tilgængelighed, fokusstyring, tastaturnavigation — og resten er
mindre arbejde at skrive end at rette.

## 2. Bevidste afvigelser fra §4

To steder afviger implementeringen fra specifikationen. Begge er dokumenteret her,
fordi en udokumenteret afvigelse er en fejl, og en dokumenteret er en beslutning.

### 2.1 `--ink-faint` er mørkere end specificeret

| | Specificeret | Implementeret |
| --- | --- | --- |
| Lys tilstand | `#8B9098` | `#6E737B` |

`#8B9098` måler **3,2:1** mod hvid. Projektets egen Definition of Done kræver
≥ 4,5:1 hele vejen igennem. `#6E737B` måler **4,57:1** målt i browseren mod den
faktiske sidebaggrund. Specifikationen modsagde sig selv; tilgængelighedskravet
vandt.

### 2.2 Mørke semantiske farver er udledt, ikke specificeret

§4 angiver kun mørke værdier for baggrund, flade, kant, blæk og accent. Der er
ingen mørke værdier for ok / advarsel / fare / info eller deres bløde fyld. De er
udledt her og kontrastmålt i browseren mod `--surface` (`#171A1E`):

| Token | Mørk værdi | Kontrast mod flade | Farvet tekst på eget bløde fyld |
| --- | --- | --- | --- |
| `--ok` | `#5CBE8A` | 7,64:1 | 7,05:1 |
| `--warn` | `#E0A94A` | 8,27:1 | 7,57:1 |
| `--danger` | `#EE8B8B` | 7,23:1 | 7,07:1 |
| `--info` | `#7FB4E8` | 7,98:1 | 7,56:1 |
| `--accent` | `#4FA8A2` | 6,20:1 | 5,13:1 |

Alle målinger er taget i den kørende app, ikke beregnet på papir.

## 3. Hvorfor `design-scout` ikke blev kørt

Fase 0.2 lagde op til at køre `design-scout` og bruge dens output som input til
§4. Det blev fravalgt.

§4 er mærket **authoritative** og er allerede usædvanligt præskriptiv: den fastlægger
ikke bare tokens, men også layout (232 px sidemenu, 1240 px indholdsbredde,
40 px rækker), hierarki (sidehoved med titel + én dæmpet linje + højrestillet
handling), interaktionsmønstre (drill-down som panel, ikke som ny rute) og bevægelse
(120/180 ms, kun opacity og transform). Der er ikke meget tilbage for en
designundersøgelse at afgøre, og risikoen for at drive væk fra en specifikation, der
udtrykkeligt vinder ved konflikt, er reel. Tiden er brugt på fase 4 i stedet, som er
det modul, der bærer projektet.

## 4. Semantisk farveregel

Farve bærer **kun** betydning:

- **Petrol** — interaktiv, aktiv, valgt
- **Grøn** — bestået
- **Ravgul** — kræver gennemsyn
- **Rød** — fejlet eller blokeret
- **Blå** — information

Intet er farvet til pynt. **Farve står aldrig alene** — hver eneste `Chip` tvinger
et ikon frem ved siden af teksten (`components/ui/chip.tsx`). Det er både et
tilgængelighedskrav og en praktisk nødvendighed: offentligt ansatte printer stadig i
gråtoner.

## 5. Skygger, kanter, bevægelse

- **Kanter, ikke skygger.** 1 px `--border` overalt. Der findes præcis ét
  skyggetoken, `--shadow-popover`, og det bruges kun af panelet og dialoger.
- **Fokusring** 2 px `--accent` med 2 px offset, på hvert eneste interaktivt
  element. Fjernes aldrig.
- **Bevægelse** 120 ms (hover/fokus) og 180 ms (paneler). Easing
  `cubic-bezier(0.2, 0, 0, 1)`. Kun `opacity` og `transform` — bortset fra
  sidemenuens bredde, som er chrome og ikke får indhold til at flyde om.
  `prefers-reduced-motion` slår alt fra.
- **Den eneste "levende" bevægelse** er den blinkende markør under streaming
  (`.caret`). Den har fortjent sin plads, fordi den kommunikerer, at der faktisk
  sker noget arbejde.

## 6. Mobil

Under `md` tvinges sidemenuen til 60 px ikonskinne uanset den gemte præference —
232 px navigation på en 375 px skærm efterlader ikke plads til indhold. Brede
tabeller ruller inde i deres egen `overflow-x-auto`-beholder, så sidekroppen
aldrig ruller vandret. Målt ved 375 px: sidekrop ruller ikke, tabel ruller.

## 7. Anti-tjekliste

Ingen af disse forekommer nogen steder i kodebasen: gradientbaggrunde ·
glassmorphism / backdrop-blur · lilla eller violet · emoji i UI-chrome ·
pilleformet navigation med tung skygge · `font-weight: 700` · animerede taltællere ·
konfetti · hero-sektion · marketingtekst inde i værktøjet · ikoner større end 20 px
i tæt UI · mere end én accentfarve · centreret brødtekst.
