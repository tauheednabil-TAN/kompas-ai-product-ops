---
name: lovaendring-konsekvensanalyse
description: Omsætter en lovændring eller vejledning til konkrete konsekvenser pr. produkt med udkast til user stories. Bruges når brugeren siger "hvad betyder denne lovændring for os", "lav en konsekvensanalyse", "vi har fået en ny bekendtgørelse" eller indsætter paragraffer, et link til retsinformation eller et udkast til vejledning. Bruges ikke til at give juridisk rådgivning — analysen er et udgangspunkt for en samtale med jurist.
---

# Konsekvensanalyse af lovændring

Formålet er at komme fra "der er kommet en ny bekendtgørelse" til "her er de fem
ting, vi skal beslutte", uden at nogen skal læse hele teksten.

## Input- og outputkontrakt

**Input:** lovtekst, bekendtgørelse, vejledning eller et link til samme.

**Output:** ét afsnit pr. berørt produkt, hvert med:

- `risikoniveau` — Lav, Middel, Høj eller Kritisk
- `hvad_ændrer_sig` — i almindeligt dansk, uden paragrafhenvisninger
- `berørte_flows` — de konkrete skærmbilleder eller arbejdsgange
- `udkast_til_user_stories` — 1 til 3 stykker
- `frist` — datoen reglen træder i kraft, eller "ikke angivet"
- `kilde_citat` — det ordrette uddrag, vurderingen bygger på

## Trin

1. Find ikrafttrædelsesdatoen først. Alt andet skal prioriteres i forhold til
   den.
2. Læs efter *forpligtelser*, ikke efter hensigter. En formulering som "bør"
   udløser ikke en ændring; "skal" gør.
3. Afgør for hver forpligtelse, om den rammer noget, systemet gør i dag. Er
   svaret nej, så skriv det — "ingen konsekvens" er et gyldigt og nyttigt
   resultat.
4. Skriv kilde_citat ordret af. Kopiér tegn for tegn. Omskriv aldrig et citat,
   der skal bruges som belæg.
5. Marker hver konklusion, du ikke er sikker på, som et åbent spørgsmål frem for
   at udglatte den.

## Regler

- **Dette er ikke juridisk rådgivning.** Skriv det som første linje i outputtet,
  hver gang.
- Opfind aldrig en frist. Står der ingen dato, så skriv "ikke angivet".
- Konkludér aldrig, at noget er lovligt eller ulovligt. Beskriv, hvad reglen
  kræver, og hvad systemet gør i dag.
- Er teksten et udkast i høring, så sig det. Udkast ændrer sig.

## Eksempel

**Input (forkortet):** et uddrag om, at kommunen fra 1. januar 2027 skal kunne
dokumentere, hvilken systematisk metode der er anvendt ved en voksenudredning.

**Output:**

> *Dette er ikke juridisk rådgivning. Analysen er et udgangspunkt for en samtale
> med jurist.*
>
> ### Sensum One — risikoniveau: Høj
>
> **Hvad ændrer sig:** Metoden bag en voksenudredning skal fremgå som et
> selvstændigt, dokumenterbart felt. I dag kan den stå i den frie tekst, hvilket
> ikke kan trækkes ud.
>
> **Berørte flows:** Opret udredning · Afslut opfølgning · Ledelsesrapporten
> "Indsatser pr. metode".
>
> **Udkast til user stories:**
> - Som sagsbehandler ønsker jeg, at metodefeltet er obligatorisk ved afslutning,
>   så udredningen ikke kan gemmes ufuldstændig.
> - Som ledelsesinformationsansvarlig ønsker jeg at kunne trække anvendt metode
>   på tværs af sager, så vi kan dokumentere det over for tilsynet.
>
> **Frist:** 1. januar 2027
>
> **Kilde-citat:** "Kommunalbestyrelsen skal kunne dokumentere, hvilken
> systematisk metode der er anvendt."
>
> **Åbent spørgsmål:** Gælder kravet også for udredninger påbegyndt før
> ikrafttrædelsen? Det fremgår ikke af uddraget.

Læg mærke til, at det åbne spørgsmål ikke er udglattet til en antagelse.
