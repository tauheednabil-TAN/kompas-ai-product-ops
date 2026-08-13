/**
 * Danish is the source dictionary. `en.ts` is typed against it, so a missing key
 * is a compile error, not a silent fallback at runtime.
 *
 * Layer 1 of the three language layers (see CLAUDE.md): interface chrome only.
 * Domain content (seed feedback, case notes, regulation text) is never in here —
 * it stays Danish in both locales.
 */
export const da = {
  app: {
    name: 'Kompas',
    tagline: 'AI Product Ops for produktteamet',
  },

  nav: {
    overblik: 'Overblik',
    agenter: 'Agenter',
    sagsspejl: 'Sagsspejl',
    faerdigheder: 'Færdigheder',
    evalueringer: 'Evalueringer',
    indsigter: 'Indsigter',
    revisionsspor: 'Revisionsspor',
    haandbog: 'Håndbog',
    collapse: 'Fold sidemenuen sammen',
    expand: 'Fold sidemenuen ud',
    primary: 'Primær navigation',
  },

  banner: {
    text: 'Demo-miljø · Alle data er syntetiske. Indsæt aldrig rigtige borgerdata.',
    dismiss: 'Skjul besked',
  },

  theme: {
    label: 'Farvetema',
    light: 'Lyst',
    dark: 'Mørkt',
    system: 'Følg systemet',
  },

  locale: {
    label: 'Sprog',
    da: 'Dansk',
    en: 'Engelsk',
  },

  common: {
    loading: 'Indlæser …',
    save: 'Gem',
    cancel: 'Annullér',
    close: 'Luk',
    copy: 'Kopiér',
    copied: 'Kopieret',
    download: 'Hent',
    search: 'Søg',
    filter: 'Filtrér',
    all: 'Alle',
    none: 'Ingen',
    of: 'af',
    show: 'Vis',
    hide: 'Skjul',
    details: 'Detaljer',
    back: 'Tilbage',
    retry: 'Prøv igen',
    sourceTextDanish: 'Kildetekst (dansk)',
    yes: 'Ja',
    no: 'Nej',
  },

  units: {
    ms: 'ms',
    tokens: 'tokens',
    tokensIn: 'Tokens ind',
    tokensOut: 'Tokens ud',
    cost: 'Omkostning',
    latency: 'Svartid',
    model: 'Model',
    promptVersion: 'Promptversion',
    agent: 'Agent',
    created: 'Oprettet',
    status: 'Status',
  },

  status: {
    ok: 'Gennemført',
    error: 'Fejl',
    blocked: 'Blokeret',
  },

  verdict: {
    label: 'Menneskelig vurdering',
    pending: 'Afventer',
    accepted: 'Godkendt',
    edited: 'Rettet',
    rejected: 'Afvist',
  },

  audit: {
    title: 'Revisionsspor',
    subtitle: 'Hvert eneste modelkald — model, promptversion, omkostning, svartid og den menneskelige vurdering.',
    empty: 'Der er endnu ingen kørsler at vise. Kør en agent, så lander den her.',
    emptyAction: 'Gå til Agenter',
    inputHash: 'Input-hash',
    inputText: 'Input',
    outputText: 'Output',
    errorMessage: 'Fejlbesked',
    humanNote: 'Note',
    verdictAt: 'Vurderet',
    rowCount: (n: number) => (n === 1 ? '1 kørsel' : `${n} kørsler`),
  },

  overblik: {
    title: 'Overblik',
    subtitle: 'Status på teamets AI-arbejde lige nu.',
    runs7d: 'Kørsler (7 dage)',
    spendMonth: 'Forbrug denne måned',
    acceptanceRate: 'Godkendelsesprocent',
    blockedCpr: 'Blokerede CPR-forsøg',
    recentRuns: 'Seneste kørsler',
    noVerdictsYet: 'Ingen vurderet endnu',
    blockedHint: 'Indsendelser stoppet af CPR-detektoren, før de nåede modellen.',
  },

  modules: {
    agenter: {
      title: 'Agenter',
      subtitle: 'Kør en agent på realistisk input og få et struktureret resultat, du kan godkende, rette eller afvise.',
      empty: 'Der er endnu ingen agenter i registret.',
    },
    sagsspejl: {
      title: 'Sagsspejl',
      subtitle:
        'Tjek et sagsnotat mod VUM 2.0, ICS og sundhedsfaglig dokumentationspraksis — form og fuldstændighed, ikke den socialfaglige vurdering.',
      empty: 'Indsæt et syntetisk notat for at komme i gang.',
    },
    faerdigheder: {
      title: 'Færdigheder',
      subtitle: 'Registret over teamets genbrugelige AI-færdigheder, og værktøjet til at skrive nye.',
      empty: 'Der er endnu ingen færdigheder i registret.',
    },
    evalueringer: {
      title: 'Evalueringer',
      subtitle:
        'Målt kvalitet pr. promptversion. Deterministiske tjek først, derefter en dommermodel på fem dimensioner.',
      empty: 'Der er endnu ingen eval-kørsler. Kør npm run eval for at oprette den første.',
    },
    indsigter: {
      title: 'Indsigter',
      subtitle: 'Mønstre i feedback, kvalitet, omkostning og svartid over tid.',
      empty: 'Der er endnu ingen data at tegne. Diagrammerne udfyldes, når der er kørsler.',
    },
    haandbog: {
      title: 'Håndbog',
      subtitle: 'Sådan bruger vi Kompas — og hvad det ikke må bruges til.',
      empty: 'Kapitlet findes ikke.',
    },
  },

  db: {
    notConfiguredTitle: 'Databasen er ikke konfigureret',
    notConfiguredBody:
      'DATABASE_URL mangler. Kopiér .env.example til .env.local, indsæt en Neon-forbindelsesstreng, og kør derefter npm run db:push.',
    unreachableTitle: 'Databasen kunne ikke nås',
    unreachableBody:
      'Forbindelsen til Neon fejlede. Kontrollér DATABASE_URL og at databasen er vågen.',
  },

  design: {
    title: 'Designsystem',
    subtitle: 'Alle komponenter i begge temaer. Siden er projektets egen visuelle regressionstest.',
    colours: 'Farver',
    typography: 'Typografi',
    buttons: 'Knapper',
    badges: 'Mærkater',
    tables: 'Tabeller',
    states: 'Tilstande',
    semanticRule:
      'Farve bærer kun betydning. Petrol = interaktiv. Grøn = bestået. Ravgul = kræver gennemsyn. Rød = fejlet eller blokeret. Blå = information. Farve står aldrig alene — der er altid et ikon eller en tekst ved siden af.',
  },

  agent: {
    inputTitle: 'Henvendelse',
    inputPlaceholder: 'Indsæt en henvendelse fra en kommune …',
    inputHint: 'Kun syntetisk tekst. CPR-numre blokeres, før teksten forlader browseren.',
    resultTitle: 'Resultat',
    resultEmpty: 'Kør agenten for at se et forslag her.',
    run: 'Kør agent',
    running: 'Kører …',
    stop: 'Afbryd',
    useSample: 'Indsæt eksempel',
    clear: 'Ryd',
    charCount: (n: number, max: number) => `${n} / ${max} tegn`,
    versionLabel: 'Promptversion',
    versionNotes: 'Hvad er ændret i denne version',

    proposalNotice:
      'Dette er et forslag, ikke en beslutning. Ingenting sker automatisk — du godkender, retter eller afviser.',
    accept: 'Godkend',
    edit: 'Ret',
    reject: 'Afvis',
    verdictSaved: 'Vurdering gemt',
    noteLabel: 'Note (valgfri)',
    notePlaceholder: 'Hvorfor afviste du forslaget?',
    addAsEvalCase: 'Tilføj som eval-case',
    submitVerdict: 'Gem vurdering',
    evalCaseCreated: 'Eval-case oprettet',
    evalCaseCommitHint:
      'Sagen er oprettet i databasen og vises med det samme. Kopiér linjen nedenfor ind i evals/<agent>/cases.jsonl og commit den — filen er kilden for npm run eval og for CI.',

    fields: {
      resumé: 'Resumé',
      produkt: 'Produkt',
      tema: 'Tema',
      alvorlighed: 'Alvorlighed',
      begrundelse_alvorlighed: 'Begrundelse for alvorlighed',
      fagligt_domæne: 'Fagligt domæne',
      påvirkede_brugere: 'Påvirkede brugere',
      foreslået_user_story: 'Foreslået user story',
      som: 'Som',
      ønsker_jeg: 'ønsker jeg',
      så_jeg: 'så jeg',
      åbne_spørgsmål: 'Åbne spørgsmål',
      citat: 'Citat fra henvendelsen',
    },
  },

  sagsspejl: {
    scopeNotice:
      'Sagsspejl vurderer dokumentationens form og fuldstændighed — ikke den socialfaglige vurdering. Den faglige beslutning er altid sagsbehandlerens.',
    consentLabel:
      'Jeg bekræfter, at teksten er syntetisk og ikke indeholder personhenførbare oplysninger.',
    noteTitle: 'Sagsnotat',
    notePlaceholder: 'Indsæt et syntetisk sagsnotat …',
    analyse: 'Analysér notat',
    analysing: 'Analyserer …',
    pickSeed: 'Vælg et eksempelnotat',
    tabFindings: 'Fund',
    tabRewrite: 'Foreslået omskrivning',
    overall: 'Samlet vurdering',
    method: 'Metode',
    findings: 'Fund',
    noFindings: 'Ingen fund. Notatet lever op til kravene til form og fuldstændighed.',
    missingFields: 'Manglende felter',
    strengths: 'Styrker',
    justification: 'Begrundelse',
    suggestion: 'Forslag',
    quote: 'Uddrag',
    jumpToQuote: 'Vis i notatet',
    quoteNotFound: 'Uddraget findes ikke ordret i notatet',
    rewriteApplied: (n: number) => (n === 1 ? '1 forslag anvendt' : `${n} forslag anvendt`),
    rewriteUnmatched: (n: number) =>
      n === 1
        ? '1 forslag kunne ikke anvendes, fordi uddraget ikke findes ordret i notatet.'
        : `${n} forslag kunne ikke anvendes, fordi uddragene ikke findes ordret i notatet.`,
    rewriteHint:
      'Intet anvendes automatisk. Kopiér det, du vil bruge.',
    copyRewrite: 'Kopiér omskrivning',
    removed: 'Fjernet',
    added: 'Tilføjet',
    footerRun: 'Se kørslen i revisionssporet',
    blockedCount: 'Blokerede indsendelser',
  },

  evals: {
    suite: 'Sæt',
    passRate: 'Bestået-rate',
    meanScore: 'Middelscore',
    lastRun: 'Seneste kørsel',
    cost: 'Omkostning',
    trend: 'Udvikling',
    caseId: 'Sag',
    result: 'Resultat',
    passed: 'Bestået',
    failed: 'Fejlet',
    unstable: 'Ustabil',
    unstableExplained:
      'Dommeren gav forskellige karakterer på tværs af de tre kørsler. En ustabil sag betyder en tvetydig rubrik — det er et fund, ikke støj.',
    calibration: 'Kalibrering',
    calibrationExplained:
      'Kalibreringssager indeholder et bevidst dårligt output. Hvis dommeren giver dem en god karakter, er dommeren i stykker, og hele kørslen er utroværdig.',
    judgeUntrustworthy: 'Dommeren bestod ikke kalibreringen',
    deterministic: 'Deterministiske tjek',
    failedChecks: 'Fejlede tjek',
    judgeRationale: 'Dommerens begrundelser',
    judgePass: (n: number) => `Kørsel ${n}`,
    spreadLabel: 'Spredning',
    input: 'Input',
    output: 'Output',
    rubricNotes: 'Rubriknoter',
    latency: 'Svartid',
    version: 'Version',
    model: 'Model',
    compare: 'Sammenlign versioner',
    compareTitle: 'Sammenligning',
    versionA: 'Version A',
    versionB: 'Version B',
    improved: 'Forbedret',
    worsened: 'Forværret',
    unchanged: 'Uændret',
    delta: 'Ændring',
    noComparison:
      'Der findes ikke kørsler for begge versioner endnu. Kør npm run eval med hver version først.',
    scoreOf: (score: number) => `${score.toFixed(1)} / 5`,
    caseCount: (n: number) => (n === 1 ? '1 sag' : `${n} sager`),
    runSuiteHint: 'Kør npm run eval for at oprette en kørsel.',
    passRule: 'Bestået kræver: alle deterministiske tjek + middelscore ≥ 4,0 + sikkerhed ≥ 4.',
    safetyVeto: 'Sikkerhed er et veto, ikke et gennemsnit.',
  },

  skills: {
    registry: 'Register',
    builder: 'Byg en færdighed',
    describeTask: 'Beskriv opgaven',
    describePlaceholder:
      'Beskriv en tilbagevendende opgave, du løser i hånden i dag. Skriv det som du ville forklare det til en ny kollega …',
    generate: 'Generér færdighed',
    generating: 'Genererer …',
    preview: 'Forhåndsvisning',
    validation: 'Validering',
    validationPassed: 'Alle tjek bestået',
    validationFailed: 'Færdigheden er ikke gyldig endnu',
    downloadZip: 'Hent som .zip',
    openPr: 'Åbn PR på GitHub',
    noSkills: 'Der er endnu ingen færdigheder i registret.',
    invalidSkill: 'Består ikke validering',
    seeded: 'Håndskrevet',
    fileName: 'Fil',
  },

  errors: {
    rate_limit: 'Kunne ikke nå Gemini-API’et (429 – for mange kald). Prøv igen om 30 sekunder.',
    timeout: 'Modellen svarede ikke inden for 60 sekunder. Prøv igen, eller forkort teksten.',
    auth: 'API-nøglen mangler eller blev afvist. Kontrollér GOOGLE_GENERATIVE_AI_API_KEY.',
    server: 'Gemini-API’et svarede med en serverfejl. Det er midlertidigt — prøv igen.',
    schema:
      'Modellens svar passede ikke til skemaet. Kørslen er logget som fejlet, og intet er gemt som gyldigt resultat.',
    cpr_blocked:
      'Teksten indeholder noget, der ligner et CPR-nummer. Indsendelsen er stoppet, og teksten er ikke sendt til modellen.',
    too_long: 'Teksten er for lang. Maksimum er 8.000 tegn.',
    consent_required:
      'Du skal bekræfte, at teksten er syntetisk, før den kan analyseres. Bekræftelsen gælder kun denne session.',
    no_database:
      'Databasen er ikke konfigureret. Hvert modelkald skal logges, så kørslen kan ikke startes uden.',
    unknown_agent: 'Agenten findes ikke.',
    unknown_version: 'Promptversionen findes ikke.',
    bad_request: 'Forespørgslen kunne ikke læses.',
    unknown: 'Der opstod en uventet fejl. Kørslen er logget.',
  },

  error: {
    generic: 'Noget gik galt under indlæsningen af siden.',
    notFound: 'Siden findes ikke',
    notFoundBody: 'Adressen fører ingen steder hen. Brug menuen til venstre.',
  },
}

/**
 * Deliberately **not** `as const`. With const assertions every value becomes its
 * own literal type, so `Dictionary` would demand that the English text be
 * character-identical to the Danish — the opposite of what we want. Widened
 * values still give full key checking, which is the point.
 */
export type Dictionary = typeof da
