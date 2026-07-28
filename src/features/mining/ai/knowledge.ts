import { registerKnowledge, type KnowledgeEntry } from "@/ai/knowledge";

const miningKnowledge: KnowledgeEntry[] = [
  {
    domain: "mining",
    topic: "overview",
    content: "Mining business involves mineral exploration, excavation, processing, and trading. Key areas: site management, licenses, equipment, fuel, production, and safety.",
    language: "en",
    tags: ["mining", "overview"],
  },
  {
    domain: "mining",
    topic: "overview",
    content: "Biashara ya madini inajumuisha uchimbaji, usafishaji, na biashara ya madini. Sehemu muhimu: maeneo ya migodi, leseni, vifaa, mafuta, uzalishaji, na usalama.",
    language: "sw",
    tags: ["mining", "overview"],
  },
  {
    domain: "mining",
    topic: "sites",
    content: "Mining sites are locations where mineral extraction occurs. Track site name, location, coordinates, size, mineral type, and status (active, inactive, depleted, on hold).",
    language: "en",
    tags: ["sites", "mining"],
  },
  {
    domain: "mining",
    topic: "sites",
    content: "Migodi ni maeneo ambapo uchimbaji wa madini unafanyika. Weka kumbukumbu ya jina, eneo, kuratibu, ukubwa, aina ya madini, na hali (inatumika, haitumiki, imekwisha, imesitishwa).",
    language: "sw",
    tags: ["sites", "mining"],
  },
  {
    domain: "mining",
    topic: "licenses",
    content: "Mining licenses include mining licenses, claims, permits, and exploration rights. Track license number, type, issuing body, issue date, expiry date, and status.",
    language: "en",
    tags: ["licenses", "permits", "compliance"],
  },
  {
    domain: "mining",
    topic: "licenses",
    content: "Leseni za madini ni pamoja na leseni za uchimbaji, madai, vibali, na haki za utafutaji. Weka kumbukumbu ya namba ya leseni, aina, mtoaji, tarehe ya kutolewa, tarehe ya kuisha, na hali.",
    language: "sw",
    tags: ["licenses", "permits", "compliance"],
  },
  {
    domain: "mining",
    topic: "equipment",
    content: "Mining equipment includes excavators, loaders, trucks, drills, and generators. Track status (operational, maintenance, repair, retired), fuel type, fuel usage, and service schedule.",
    language: "en",
    tags: ["equipment", "machinery"],
  },
  {
    domain: "mining",
    topic: "equipment",
    content: "Vifaa vya madini ni pamoja na excavator, loaders, malori, drills, na jenereta. Fuatilia hali (inafanya kazi, matengenezo, ukarabati, imestaafu), aina ya mafuta, na ratiba ya huduma.",
    language: "sw",
    tags: ["equipment", "machinery"],
  },
  {
    domain: "mining",
    topic: "fuel",
    content: "Fuel management tracks diesel, petrol, lubricant, and grease consumption. Monitor quantity, unit cost, total cost, supplier, and link to specific equipment or site.",
    language: "en",
    tags: ["fuel", "consumption"],
  },
  {
    domain: "mining",
    topic: "fuel",
    content: "Usimamizi wa mafuta unafuatilia matumizi ya dizeli, petroli, mafuta ya kulainisha, na grisi. Fuatilia kiasi, gharama kwa kila lita, gharama jumla, muuzaji, na kiungo kwa vifaa au eneo.",
    language: "sw",
    tags: ["fuel", "consumption"],
  },
  {
    domain: "mining",
    topic: "production",
    content: "Production logging tracks daily mineral output. Record quantity, unit (tonnes, kg), grade, and link to site and catalog item.",
    language: "en",
    tags: ["production", "output"],
  },
  {
    domain: "mining",
    topic: "production",
    content: "Kumbukumbu za uzalishaji zinafuatilia pato la kila siku la madini. Rekodi kiasi, kitengo (tani, kilo), daraja, na kiungo kwa eneo na bidhaa.",
    language: "sw",
    tags: ["production", "output"],
  },
  {
    domain: "mining",
    topic: "safety",
    content: "Mine safety is critical. Track equipment maintenance schedules, service logs, incident reports, and ensure compliance with safety regulations.",
    language: "en",
    tags: ["safety", "compliance"],
  },
  {
    domain: "mining",
    topic: "safety",
    content: "Usalama wa migodini ni muhimu sana. Fuatilia ratiba za matengenezo ya vifaa, kumbukumbu za huduma, ripoti za matukio, na hakikisha kufuata kanuni za usalama.",
    language: "sw",
    tags: ["safety", "compliance"],
  },
];

registerKnowledge(miningKnowledge);
