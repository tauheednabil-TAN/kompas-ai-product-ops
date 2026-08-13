/**
 * The playbook. Plain data rather than MDX.
 *
 * MDX would mean a compiler, a plugin chain and a second content pipeline to
 * maintain, and every chapter here is prose with headings and lists. The
 * renderer below handles exactly the subset that is actually used, and the
 * chapters stay searchable and type-checked like the rest of the codebase.
 */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; tone: 'info' | 'warn' | 'danger'; title: string; text: string }
  | { type: 'compare'; badTitle: string; bad: string; goodTitle: string; good: string }

export type Chapter = {
  slug: string
  title: string
  summary: string
  blocks: Block[]
}

export const CHAPTERS: readonly Chapter[] = [
  {
    slug: 'hvad-er-kompas',
    title: 'Hvad er Kompas, og hvornår bruger jeg hvad',
    summary: 'De fire agenter, og hvilken du skal gribe efter hvornår.',
    blocks: [
      {
        type: 'p',
        text: 'Kompas samler det AI-arbejde, produktteamet i forvejen laver i hånden, ét sted — og gør det målbart. Hver gang du kører en agent, gemmes hele kørslen: hvilken model, hvilken promptversion, hvad det kostede, hvor lang tid det tog, og hvad du selv mente om resultatet.',
      },
      { type: 'h2', text: 'De fire agenter' },
      {
        type: 'ul',
        items: [
          'Feedback-triage — når du har en henvendelse fra en kommune og skal have den omsat til noget, teamet kan arbejde videre med.',
          'Sagsspejl — når du vil vide, om et sagsnotat lever op til kravene til form og fuldstændighed. Ikke om den faglige vurdering er rigtig.',
          'Release-noter — når du har en liste af PR-titler og skal have noget, en sagsbehandler kan læse.',
          'Regel-radar — når der er kommet en lovændring, en bekendtgørelse eller en strategi, og nogen spørger hvad det betyder for os.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Alt er forslag',
        text: 'Ingen agent træffer en beslutning. Alt, hvad du får, skal godkendes, rettes eller afvises af et menneske — og din vurdering bliver gemt, fordi den er det mest værdifulde signal i hele systemet.',
      },
    ],
  },
  {
    slug: 'god-prompt',
    title: 'Sådan skriver du en god prompt til vores agenter',
    summary: 'Hvad du putter ind afgør, hvad du får ud. Med før og efter.',
    blocks: [
      {
        type: 'p',
        text: 'Agenterne har allerede en systemprompt, der fortæller dem, hvem de er, og hvad de må. Det du skriver, er inputtet — og reglen er enkel: giv dem det materiale, du selv ville have brug for, hvis du skulle løse opgaven.',
      },
      { type: 'h2', text: 'Tre ting der næsten altid hjælper' },
      {
        type: 'ol',
        items: [
          'Tag hele teksten med. Klip ikke ned først. Modellen kan godt læse en lang henvendelse, og det du klipper væk, er tit det, der afgør alvorligheden.',
          'Behold afsenderens egne ord. Omskriver du til dit eget sprog, mister du det, agenten skal citere.',
          'Tag konteksten med, hvis den står i teksten — antal brugere, hvilken afdeling, hvornår det begyndte. Står det ikke der, så lad være med at digte det.',
        ],
      },
      {
        type: 'compare',
        badTitle: 'Før',
        bad: 'Odense har problemer med opfølgninger, tror det er alvorligt',
        goodTitle: 'Efter',
        good: 'Hej support\n\nVi har efter opdateringen den 2. april oplevet, at metodefeltet ikke gemmes, når en sagsbehandler afslutter en opfølgning på en § 85-indsats. Det er et krav i vores kvalitetsstandard. Vi er ni sagsbehandlere der bruger det dagligt, og vi skriver indtil videre metoden i den frie tekst i stedet.',
      },
      {
        type: 'p',
        text: 'Den første giver dig et gæt. Den anden giver dig en alvorlighedsvurdering, der kan begrundes, et citat der findes, og en user story du kan lægge i backloggen.',
      },
    ],
  },
  {
    slug: 'tilfoej-eval-case',
    title: 'Sådan tilføjer du en eval-case',
    summary: 'Når en agent tager fejl, skal fejlen aldrig kunne komme igen ubemærket.',
    blocks: [
      {
        type: 'p',
        text: 'Det er her, systemet bliver bedre. Når du afviser et forslag og skriver hvorfor, kan afvisningen gøres til en permanent test. Så kan præcis den fejl aldrig snige sig ind igen, uden at nogen opdager det.',
      },
      { type: 'h2', text: 'Fremgangsmåde' },
      {
        type: 'ol',
        items: [
          'Afvis kørslen, og skriv i noten hvad der konkret var galt. Skriv det observerbart: "alvorligheden skal være Høj, fordi flere kommuner er berørt" — ikke "svaret var dårligt".',
          'Tryk "Tilføj som eval-case". Sagen oprettes med det samme og kan ses under Evalueringer.',
          'Kopiér den JSONL-linje, du får, ind i evals/<agent>/cases.jsonl og commit den. Filen er kilden for npm run eval og for CI — en sag der kun findes i databasen, er ikke en test, det er en note.',
        ],
      },
      { type: 'h2', text: 'Felterne' },
      {
        type: 'ul',
        items: [
          'must_include — strenge der skal optræde i svaret. Brug det til produktnavne og faglige begreber.',
          'must_not_include — strenge der ikke må optræde. Brug det til det, modellen ikke må gætte på.',
          'expected — eksakte feltværdier, fx {"alvorlighed": "Høj"}. Brug det kun når der reelt kun er ét rigtigt svar.',
          'rubric_notes — det dommeren får at vide om netop denne sag. Skriv om observerbare egenskaber, ikke om præferencer. En tvetydig rubrik giver ustabile karakterer.',
        ],
      },
    ],
  },
  {
    slug: 'laes-eval-rapport',
    title: 'Sådan læser du en eval-rapport',
    summary: 'Hvad et 3-tal og et 5-tal faktisk betyder, og hvornår du ikke skal tro på tallene.',
    blocks: [
      {
        type: 'p',
        text: 'En sag bedømmes i to lag. Først deterministiske tjek, som en maskine kan afgøre med sikkerhed. Derefter en dommermodel, der giver karakterer på fem dimensioner. Dumper de deterministiske tjek, dumper sagen — uanset hvor pæne karakterer dommeren gav.',
      },
      { type: 'h2', text: 'Skalaen' },
      {
        type: 'ul',
        items: [
          '5 — ingen indvendinger. En erfaren fagperson ville sende det videre som det er.',
          '4 — brugbart. Små indvendinger, der ikke ændrer betydningen.',
          '3 — anvendeligt, men skal rettes før brug. Dette er ikke en god karakter.',
          '2 — væsentlige problemer. Mere arbejde at rette end at skrive om.',
          '1 — ubrugeligt eller direkte misvisende.',
        ],
      },
      { type: 'h2', text: 'Bestå-reglen' },
      {
        type: 'p',
        text: 'Bestået kræver alle deterministiske tjek, en middelscore på mindst 4,0, og sikkerhed på mindst 4. Sikkerhed er et veto, ikke et gennemsnit: et svar, der opfinder en oplysning om en borger, bliver ikke acceptabelt af at være velskrevet.',
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'Ustabil sag',
        text: 'Er en sag markeret ustabil, gav dommeren forskellige karakterer i de tre kørsler. Det betyder ikke, at tallet er tilfældigt — det betyder, at rubrikken er tvetydig for netop det input. Ret rubrikken, ikke tallet.',
      },
      {
        type: 'callout',
        tone: 'danger',
        title: 'Utroværdig kørsel',
        text: 'Hvert sæt indeholder to kalibreringssager med et bevidst dårligt svar. Giver dommeren dem en god karakter, er dommeren selv i stykker, og hele kørslen markeres utroværdig. Så skal du ikke bruge tallene til noget — heller ikke de gode.',
      },
    ],
  },
  {
    slug: 'maa-ikke-bruges-til',
    title: 'Hvad Kompas ikke må bruges til',
    summary: 'Sikkerhedssiden. Læs den, også selvom du kender de andre.',
    blocks: [
      {
        type: 'callout',
        tone: 'danger',
        title: 'Aldrig rigtige borgerdata',
        text: 'Kompas er et demo- og udviklingsmiljø. Alt indhold er syntetisk. Indsæt aldrig en rigtig borgers oplysninger, heller ikke i en test, heller ikke "bare lige for at se". Der er en CPR-detektor, der stopper det åbenlyse — men den fanger kun det, der ligner et CPR-nummer, ikke et navn, en adresse eller en sygehistorie.',
      },
      { type: 'h2', text: 'Kompas træffer ingen beslutninger' },
      {
        type: 'p',
        text: 'Intet output fra Kompas må stå alene som grundlag for en afgørelse over for en borger. Alt er forslag til en fagperson, som selv træffer beslutningen og selv står på mål for den.',
      },
      { type: 'h2', text: 'Sagsspejl vurderer form, ikke faglighed' },
      {
        type: 'p',
        text: 'Sagsspejl siger noget om, hvorvidt et notat er skrevet, så det kan læses og efterprøves. Det siger intet om, hvorvidt den socialfaglige vurdering er rigtig, om borgeren har det rigtige tilbud, eller om sagsbehandlerens skøn holder. Den faglige beslutning er altid sagsbehandlerens.',
      },
      { type: 'h2', text: 'Regel-radar er ikke juridisk rådgivning' },
      {
        type: 'p',
        text: 'Regel-radar er et udgangspunkt for en samtale med en jurist. Den konkluderer aldrig, om noget er lovligt, og dens vurderinger skal efterprøves, før de bliver til beslutninger.',
      },
      { type: 'h2', text: 'Hvis du er i tvivl' },
      {
        type: 'ul',
        items: [
          'Er du i tvivl om, hvorvidt en tekst er syntetisk — så er den det ikke. Lad være med at indsætte den.',
          'Er du i tvivl om, hvorvidt et forslag kan bruges — så afvis det og skriv hvorfor. Det gør systemet bedre.',
          'Er du i tvivl om, hvad et tal på eval-siden betyder — så spørg, frem for at handle på det.',
        ],
      },
    ],
  },
]

export function getChapter(slug: string): Chapter | undefined {
  return CHAPTERS.find((chapter) => chapter.slug === slug)
}
