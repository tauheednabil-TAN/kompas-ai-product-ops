---
name: release-note-dansk
description: Skriver kundevendte danske release notes ud fra tekniske commit- eller PR-beskrivelser. Bruges når brugeren siger "skriv release notes", "lav en dansk beskrivelse af denne release", "hvad skal vi fortælle kunderne om denne version" eller indsætter en liste af PR-titler. Bruges ikke til interne changelogs — dem skriver vi som de er.
---

# Danske release notes

En sagsbehandler i en kommune skal kunne læse noten og forstå, hvad der er
anderledes i dag, uden at kende et eneste teknisk begreb.

## Input- og outputkontrakt

**Input:** en liste af PR-titler eller commit-beskeder, typisk på engelsk og
typisk tekniske.

**Output:** markdown grupperet efter *hvad brugeren kan gøre nu*, ikke efter
`feat`/`fix`/`chore`.

## Trin

1. Kassér alt, brugeren ikke kan mærke: refaktorering, opgraderinger af
   afhængigheder, testændringer, oprydning.
2. Oversæt hver tilbageværende ændring til den handling, den muliggør. "Fix null
   check in follow-up form" bliver til "Opfølgninger kan nu gemmes, selvom
   metodefeltet er tomt".
3. Grupper efter arbejdsområde — Myndighed, Udfører, Ledelsesinformation,
   Administration — ikke efter commit-type.
4. Sæt ændringer med konsekvens for arbejdsgange øverst i hver gruppe.
5. Skriv en linje under overskriften "Det skal support vide" med de tre
   spørgsmål, supporten sandsynligvis får i næste uge.

## Sprogregler

- Aktiv form, nutid: "Systemet gemmer nu metodefeltet", ikke "Metodefeltet vil
  blive gemt".
- Ingen anglicismer, hvor der findes et dansk fagord: *bruger*, ikke *user*.
  *Sag*, ikke *case*. *Indsats*, ikke *service*.
- Ingen versionsnumre i brødteksten. De hører i overskriften.
- Ingen undskyldninger og ingen selvros. "Vi har rettet en fejl" er nok.

## Regler

- Opfind aldrig en ændring, der ikke står i inputtet.
- Er en PR-titel for kryptisk til at oversætte, så list den under "Uklart" frem
  for at gætte.

## Eksempel

**Input:**

```
fix: null check in follow-up method field
feat: export case list to xlsx
chore: bump drizzle-orm to 0.45
refactor: extract audit writer
```

**Output:**

> ## Version 4.12
>
> ### Myndighed
> - Opfølgninger kan nu gemmes, selvom metodefeltet er tomt. Tidligere blev
>   hele opfølgningen afvist uden besked.
>
> ### Ledelsesinformation
> - Sagslisten kan nu hentes som regneark.
>
> ### Det skal support vide
> - Kommuner, der har skrevet metoden i den frie tekst som en nødløsning, skal
>   ikke rette bagud — de gamle notater er uændrede.
> - Regnearket indeholder de samme kolonner som skærmbilledet, i samme
>   rækkefølge.
> - Der er ingen ændring i rettighedsstyringen i denne version.

Læg mærke til, at de to sidste linjer i inputtet ikke optræder i outputtet. En
opgradering af en afhængighed og en intern oprydning er ikke noget, en
sagsbehandler kan mærke.
