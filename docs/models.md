# Modellandskab — research og valg

**Hentet:** 13. august 2026
**Kilder:**

- <https://ai.google.dev/gemini-api/docs/models>
- <https://ai.google.dev/gemini-api/docs/pricing>
- <https://ai-sdk.dev/providers/ai-sdk-providers/google>
- Typedefinitioner læst direkte i `node_modules/@ai-sdk/google/dist/index.d.ts` og
  `node_modules/ai/dist/index.d.ts` (den mest pålidelige kilde til det faktiske API)

Denne fil dokumenterer **hvad der blev fundet**, ikke hvad der blev antaget. Hvis det
live API afviger fra denne fil, vinder API'et — og så opdateres filen og afvigelsen
noteres i `PROGRESS.md`.

---

## 1. Tilgængelige tekstmodeller (paid tier, pris pr. 1M tokens, USD)

| Model ID                 | Status  | Input | Output | Kommentar                                    |
| ------------------------ | ------- | ----: | -----: | -------------------------------------------- |
| `gemini-3.1-pro-preview` | preview | 2,00  |  12,00 | Stærkeste ræsonnering, men preview           |
| `gemini-3.6-flash`       | GA      | 1,50  |   7,50 | Nyeste balancerede GA-model                  |
| `gemini-3.5-flash`       | GA      | 1,50  |   9,00 | Agentisk/kodning                             |
| `gemini-3.5-flash-lite`  | GA      | 0,30  |   2,50 | Hurtig, billig                               |
| `gemini-3.1-flash-lite`  | GA      | 0,25  |   1,50 | Billig                                       |
| `gemini-2.5-pro`         | GA      | 1,25  |  10,00 | Dyb ræsonnering, GA                          |
| `gemini-2.5-flash`       | GA      | 0,30  |   2,50 | Tidligere arbejdshest                        |
| `gemini-2.5-flash-lite`  | GA      | 0,10  |   0,40 | Billigste tekstmodel                         |

Priser over 200k tokens pr. prompt er højere for `gemini-2.5-pro` og
`gemini-3.1-pro-preview`. Kompas sender aldrig prompts i den størrelsesorden
(Sagsspejl er hårdt begrænset til 8.000 tegn), så de lave takster er dem, der
regnes med. Det er en antagelse, og den står i `README.md` under begrænsninger.

## 2. Valgte tiers

Registret ligger i `lib/ai/models.ts` og er det eneste sted i kodebasen, hvor et
model-id eller en pris forekommer.

| Tier         | Model ID                | Hvorfor                                                                                                                                        |
| ------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `judge`      | `gemini-2.5-pro`        | Dommeren skal have den stærkeste ræsonnering, men **må ikke** være en preview-model. Et preview-id kan trækkes tilbage; demoen har en fast dato. |
| `workhorse`  | `gemini-3.6-flash`      | Nyeste balancerede GA-model. Bedre dansk end 2.5-serien, og stadig ~0,03 kr. pr. agentkørsel.                                                    |
| `classifier` | `gemini-2.5-flash-lite` | Billigste tekstmodel. Bruges i `DEMO_MODE`, så et delt demolink ikke kan dræne API-nøglen.                                                        |

### Hvorfor ikke `gemini-3.1-pro-preview` som dommer

Den er stærkere på papiret og kun ~60 % dyrere. Men en dommermodel, der skifter
adfærd midt i projektet, ugyldiggør alle historiske eval-scores — hele pointen med
harnesset er, at tal fra i går kan sammenlignes med tal fra i dag. En GA-model er
den rigtige afvejning her. Det er et bevidst valg, ikke en forglemmelse.

### Hvorfor ikke `gemini-2.5-flash` som arbejdshest

Den er 5× billigere på input (0,30 vs. 1,50). Ved det faktiske forbrug er
forskellen ~0,03 kr. mod ~0,009 kr. pr. kørsel. Det er ikke penge nok til at
betale for dårligere dansk *myndighedssprog*, som er selve produktet. Den billige
tier findes i registret og bruges i `DEMO_MODE`.

## 3. Valuta

USD → DKK: **6,48** pr. 11. august 2026 (kilde: exchange-rates.org).

Kursen er **fast og dateret**, ikke hentet live. To grunde: en demo må ikke afhænge
af et FX-API, og en kurs, der glider, gør historiske omkostningsrækker
usammenlignelige. Konstanten står i `lib/ai/models.ts` som `USD_TO_DKK`.

## 4. Struktureret output

Bekræftet i typedefinitionerne, ikke kun i dokumentationen:

- `@ai-sdk/google` sætter `structuredOutputs: true` som default. Skemaet sendes til
  provideren som JSON Schema, så modellen tvinges til gyldig JSON. Vi bruger
  `streamObject` / `generateObject` fra `ai` med Zod-skemaer (constraint **C6**).
- `usage` returneres som `{ inputTokens: number | undefined, outputTokens: number | undefined }`
  — begge kan mangle. `lib/ai/cost.ts` coercer til 0 frem for at kaste, så en
  manglende tælling aldrig taber en auditrække.
- `streamObject(...)` giver `partialObjectStream`, `object`, `usage`, `finishReason`
  og `toTextStreamResponse()`. Delobjekter i streamen er **ikke** valideret —
  klienten må selv behandle dem som ufuldstændige.

## 5. Thinking / reasoning budget

De to modelfamilier styrer det forskelligt, og det er derfor `ModelSpec.thinking`
er en tagged union frem for et tal:

- **Gemini 3.x** — `providerOptions.google.thinkingConfig.thinkingLevel`:
  `'minimal' | 'low' | 'medium' | 'high'`.
- **Gemini 2.5** — `providerOptions.google.thinkingConfig.thinkingBudget`: et
  tokenantal. `0` slår thinking fra på de modeller, der understøtter det.

Valg: arbejdshesten kører `thinkingLevel: 'low'` (struktureret udtræk kræver ikke
dyb ræsonnering, og thinking-tokens tæller som output-tokens), dommeren kører
`thinkingBudget: 4096` (her er ræsonnering hele opgaven), og den billige tier kører
`thinkingBudget: 0`.

## 6. Version-noter, der afveg fra prompten

| Prompten sagde  | Virkeligheden 13/8-2026        | Handling                                                            |
| --------------- | ------------------------------ | ------------------------------------------------------------------- |
| Vercel AI SDK v5 | `ai@7.0.64`                    | Bruger v7. API'et er læst i `.d.ts`, ikke gættet.                    |
| Next.js 15+      | `next@16.3.0`                  | Bruger 16. Turbopack er default; `params`/`cookies` er async.        |
| `next lint`      | Fjernet i Next 16              | `npm run lint` kalder ESLint CLI direkte.                            |
| Zod              | `zod@4.4.3`                    | Zod 4.                                                               |
