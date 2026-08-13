---
name: kommune-feedback-resume
description: Opsummerer en samling henvendelser fra kommuner til ét kort statusafsnit til produktteamets ugemøde. Bruges når brugeren siger "lav et resumé af ugens henvendelser", "hvad har kommunerne skrevet om", "opsummer feedback fra support" eller indsætter flere supportsager på én gang. Bruges ikke til at triagere en enkelt henvendelse — brug feedback-triage-agenten til det.
---

# Resumé af kommunefeedback

Formålet er at give produktteamet ét afsnit, de kan læse højt på ugemødet, uden
at nogen skal åbne supportsystemet.

## Input- og outputkontrakt

**Input:** to eller flere henvendelser fra kommuner, i rå form. Må gerne være
blandet mellem supportsager, mødereferater og videresendte mails.

**Output:** markdown med præcis disse fire dele, i denne rækkefølge:

1. **Overskrift** — én linje på højst 12 ord, der siger hvad ugen handlede om
2. **Mønstre** — 2 til 4 punkter, hver med antal berørte kommuner i parentes
3. **Værd at bemærke** — netop én henvendelse, der ikke passer ind i mønstrene,
   men som nogen bør se
4. **Ingen handling nødvendig** — det, der blev meldt ind, men som er
   forventet adfærd eller allerede løst

## Trin

1. Læs alle henvendelser igennem, før du skriver noget.
2. Grupper dem efter, hvad brugeren forsøgte at gøre, ikke efter hvilket produkt
   de nævner. Det samme underliggende problem melder sig ofte forskelligt i
   forskellige produkter.
3. Tæl antallet af *kommuner* pr. mønster, ikke antallet af henvendelser. Fem
   sager fra Odense er ét signal, ikke fem.
4. Vælg præcis én henvendelse til "Værd at bemærke". Vælg den, der ville ændre en
   prioritering, hvis nogen læste den — ikke den mest dramatiske.
5. Skriv i neutralt myndighedssprog. Ingen udråbstegn, ingen vurderinger af
   afsenderens tone.

## Regler

- Opfind aldrig et antal. Står der ikke hvor mange brugere der er berørt, så skriv
  "antal ukendt".
- Gengiv aldrig personoplysninger, heller ikke navne på medarbejdere i kommunen.
- Er der kun én henvendelse, så sig det og lad være med at konstruere et mønster.

## Eksempel

**Input (forkortet):** fire supportsager fra Odense, Aarhus og Vejle om
manglende felter efter en opdatering, plus én mail om en knapplacering.

**Output:**

> ### Opdateringen den 2. april fjernede felter i tre kommuner
>
> **Mønstre**
> - Felter forsvinder ved afslutning af opfølgning (3 kommuner)
> - Ingen fejlbesked når handlingen fejler (2 kommuner)
>
> **Værd at bemærke**
> Vejle bruger den frie tekst som erstatning for metodefeltet. Det betyder, at
> deres ledelsesinformation bliver ubrugelig, længe før nogen melder det som en
> fejl.
>
> **Ingen handling nødvendig**
> Knapplacering i sagsoversigten — kosmetisk, meldt af én bruger.

Læg mærke til, at "Værd at bemærke" ikke er den mest vrede henvendelse, men den
med den længste konsekvens.
