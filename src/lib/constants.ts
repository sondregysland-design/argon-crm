export const KOMMUNER = [
  { value: "", label: "Alle kommuner" },
  // Rogaland
  { value: "1103", label: "Stavanger" },
  { value: "1108", label: "Sandnes" },
  { value: "1101", label: "Eigersund" },
  { value: "1106", label: "Haugesund" },
  { value: "1149", label: "Karmøy" },
  { value: "1160", label: "Sola" },
  { value: "1127", label: "Randaberg" },
  // Vestland
  { value: "4601", label: "Bergen" },
  // Oslo/Viken
  { value: "0301", label: "Oslo" },
  { value: "3005", label: "Drammen" },
  { value: "3024", label: "Bærum" },
  // Trøndelag
  { value: "5001", label: "Trondheim" },
  // Nordland
  { value: "1806", label: "Bodø" },
  // Troms
  { value: "5401", label: "Tromsø" },
  // Agder
  { value: "4204", label: "Kristiansand" },
  // Møre og Romsdal
  { value: "1507", label: "Ålesund" },
  // Vestfold/Telemark
  { value: "3803", label: "Tønsberg" },
  { value: "3901", label: "Porsgrunn" },
];

export const PROJECT_TYPES = [
  { value: "", label: "Velg prosjekttype" },
  { value: "consulting", label: "Rådgivning" },
  { value: "inspection", label: "Inspeksjon" },
  { value: "engineering", label: "Ingeniør" },
  { value: "maintenance", label: "Vedlikehold" },
  { value: "installation", label: "Installasjon" },
  { value: "commissioning", label: "Igangkjøring" },
];

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  consulting: "Rådgivning",
  inspection: "Inspeksjon",
  engineering: "Ingeniør",
  maintenance: "Vedlikehold",
  installation: "Installasjon",
  commissioning: "Igangkjøring",
};

export const NACE_CODES = [
  { value: "", label: "Alle bransjer" },
  // === OLJE, GASS & ENERGISERVICE ===
  { value: "06", label: "06 — Utvinning av råolje og naturgass" },
  { value: "06.1", label: "06.1 — Utvinning av råolje" },
  { value: "06.2", label: "06.2 — Utvinning av naturgass" },
  { value: "09", label: "09 — Tjenester tilknyttet utvinning" },
  { value: "09.1", label: "09.1 — Servicetjenester til oljeutvinning" },
  { value: "09.10", label: "09.10 — Tjenester tilknyttet olje- og gassutvinning" },
  // Subsea, boring, vedlikehold (typisk under 09, 28, 30, 33, 71)
  { value: "28.99", label: "28.99 — Spesialmaskiner (subsea, brønnverktøy)" },
  { value: "30.11", label: "30.11 — Bygging av skip og flytende materiell" },
  { value: "30.113", label: "30.113 — Bygging av oljeplattformer og moduler" },
  { value: "33.12", label: "33.12 — Reparasjon av maskiner (vedlikehold offshore)" },
  { value: "33.14", label: "33.14 — Reparasjon av elektrisk utstyr" },
  { value: "33.20", label: "33.20 — Installasjon av industrimaskiner" },
  { value: "43.21", label: "43.21 — Elektrisk installasjonsarbeid" },
  { value: "43.22", label: "43.22 — VVS-arbeid" },
  { value: "43.29", label: "43.29 — Annet installasjonsarbeid" },
  { value: "43.99", label: "43.99 — Annen spesialisert bygge- og anleggsvirksomhet" },
  { value: "46.69", label: "46.69 — Engroshandel med maskiner og utstyr" },
  { value: "52.22", label: "52.22 — Tjenester tilknyttet sjøtransport (supply)" },
  { value: "71.12", label: "71.12 — Teknisk konsulentvirksomhet (engineering)" },
  { value: "71.20", label: "71.20 — Teknisk prøving og analyse (inspeksjon)" },
  { value: "74.90", label: "74.90 — Annen teknisk virksomhet (NDT, ROV)" },
  // Industri
  { value: "10", label: "10 — Næringsmiddelindustri" },
  { value: "20", label: "20 — Kjemisk industri" },
  { value: "22", label: "22 — Gummi- og plastindustri" },
  { value: "24", label: "24 — Metallindustri" },
  { value: "25", label: "25 — Metallvareindustri" },
  { value: "28", label: "28 — Maskinindustri" },
  { value: "30", label: "30 — Transport­middel­industri" },
  { value: "33", label: "33 — Reparasjon og installasjon av maskiner" },
  // Energi og vann
  { value: "35", label: "35 — Elektrisitets-, gass- og varmtvannsforsyning" },
  { value: "36", label: "36 — Vannforsyning" },
  // Bygg og anlegg
  { value: "41", label: "41 — Oppføring av bygninger" },
  { value: "42", label: "42 — Anleggsvirksomhet" },
  { value: "43", label: "43 — Spesialisert bygge- og anleggsvirksomhet" },
  // Handel
  { value: "45", label: "45 — Handel med og reparasjon av motorvogner" },
  { value: "46", label: "46 — Agentur- og engroshandel" },
  { value: "47", label: "47 — Detaljhandel" },
  // Transport
  { value: "49", label: "49 — Landtransport og rørtransport" },
  { value: "50", label: "50 — Sjøfart" },
  { value: "52", label: "52 — Lagring og tjenester tilknyttet transport" },
  // Overnatting og servering
  { value: "55", label: "55 — Overnattingsvirksomhet" },
  { value: "56", label: "56 — Serveringsvirksomhet" },
  // IT og kommunikasjon
  { value: "58", label: "58 — Forlagsvirksomhet" },
  { value: "61", label: "61 — Telekommunikasjon" },
  { value: "62", label: "62 — Programmering og konsulentvirksomhet" },
  { value: "63", label: "63 — Informasjonstjenester" },
  // Finans og forsikring
  { value: "64", label: "64 — Finansiell tjenesteyting" },
  { value: "65", label: "65 — Forsikring og pensjonskasser" },
  { value: "66", label: "66 — Tjenester tilknyttet finans og forsikring" },
  // Eiendom
  { value: "68", label: "68 — Omsetning og drift av fast eiendom" },
  // Faglig og teknisk
  { value: "69", label: "69 — Juridisk og regnskapsmessig tjenesteyting" },
  { value: "70", label: "70 — Hovedkontortjenester og administrativ rådgivning" },
  { value: "71", label: "71 — Arkitektur og teknisk konsulentvirksomhet" },
  { value: "72", label: "72 — Forskning og utviklingsarbeid" },
  { value: "73", label: "73 — Annonse- og reklamevirksomhet" },
  { value: "74", label: "74 — Annen faglig, vitenskapelig og teknisk virksomhet" },
  // Utleie og bemanning
  { value: "77", label: "77 — Utleievirksomhet" },
  { value: "78", label: "78 — Arbeidskrafttjenester" },
  // Helse
  { value: "86", label: "86 — Helsetjenester" },
  { value: "87", label: "87 — Pleie- og omsorgstjenester" },
  // Undervisning
  { value: "85", label: "85 — Undervisning" },
];

export const PRODUCT_UNITS = [
  { value: "stk", label: "Stk" },
  { value: "time", label: "Time" },
  { value: "måned", label: "Måned" },
  { value: "prosjekt", label: "Prosjekt" },
];

export const QUOTE_STATUSES = [
  { value: "", label: "Alle statuser" },
  { value: "utkast", label: "Utkast" },
  { value: "sendt", label: "Sendt" },
  { value: "akseptert", label: "Akseptert" },
  { value: "avvist", label: "Avvist" },
];

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  utkast: "Utkast",
  sendt: "Sendt",
  akseptert: "Akseptert",
  avvist: "Avvist",
};
