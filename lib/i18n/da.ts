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
