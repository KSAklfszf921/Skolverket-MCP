# Användningsexempel

## För Elever och Föräldrar

**"Vilka yrkeshögskoleutbildningar inom IT finns i Stockholm som startar i höst?"**
```
Använder: search_adult_education
Resultat: Lista över YH-utbildningar med startdatum och antagning
```

**"Vad är kunskapskraven för betyget E i Matematik 1c?"**
```
Använder: get_course_details med kod "MATMAT01c"
Resultat: Fullständiga kunskapskrav för alla betyg
```

## För Lärare

**"Visa centralt innehåll för Svenska 2 på gymnasiet"**
```
Använder: get_course_details
Resultat: Detaljerat centralt innehåll strukturerat per område
```

**"Hitta alla aktiva skolor i Göteborg"**
```
Använder: search_school_units med filter
Resultat: Lista över aktiva skolenheter
```

## För Studie- och Yrkesvägledare

**"Vilka inriktningar finns på Naturvetenskapsprogrammet?"**
```
Använder: get_program_details med kod "NA"
Resultat: Inriktningar, profiler och yrkesutfall
```

**"Visa alla SFI-kurser med låg studietakt i Uppsala"**
```
Använder: search_adult_education med filter
Resultat: SFI-utbildningar anpassade för sökkriterierna
```

## För Forskare och Administratörer

**"Hur har läroplanen för matematik förändrats mellan 2011 och 2022?"**
```
Använder: get_subject_versions + get_subject_details
Resultat: Jämförelse mellan olika versioner
```

**"Vilka skolor har lagts ner i Stockholms län de senaste åren?"**
```
Använder: get_school_units_by_status med status "UPPHORT"
Resultat: Lista över nedlagda skolenheter
```
