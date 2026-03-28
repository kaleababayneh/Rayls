export interface RuleResult {
  name: string;
  passed: boolean;
  score: number;
  weight: number;
  reason: string;
  critical: boolean;
}

export interface RuleReport {
  results: RuleResult[];
  totalScore: number;
  criticalFailures: string[];
}

// Multi-brand caliber → reference mapping
const KNOWN_CALIBERS: Record<string, string[]> = {
  // Rolex
  "3235": ["126610LN", "126610LV", "126613LB", "126611LN"],
  "3285": ["126710BLNR", "126710BLRO", "126720VTNR"],
  "4131": ["126500LN"],
  "3230": ["124300", "124060"],
  // Omega
  "3861": ["310.30.42.50.01.001", "310.30.42.50.01.002"],
  "8900": ["210.30.42.20.01.001", "220.10.41.21.01.001"],
  "9900": ["329.30.44.51.01.001"],
  // Audemars Piguet
  "4302": ["15500ST.OO.1220ST.01", "15510ST.OO.1320ST.01"],
  "2385": ["26331ST.OO.1220ST.01"],
  "4401": ["26240ST.OO.1220ST.01"],
};

const PRODUCTION_YEARS: Record<string, [number, number]> = {
  // Rolex
  "126610LN": [2020, 2026],
  "126610LV": [2020, 2026],
  "126611LN": [2020, 2026],
  "126710BLNR": [2019, 2026],
  "126710BLRO": [2023, 2026],
  "124060": [2020, 2026],
  // Omega
  "310.30.42.50.01.001": [2021, 2026],
  "210.30.42.20.01.001": [2018, 2026],
  // AP
  "15500ST.OO.1220ST.01": [2019, 2026],
  "15510ST.OO.1320ST.01": [2022, 2026],
};

// Brand-specific valid materials
const BRAND_MATERIALS: Record<string, string[]> = {
  "Rolex": [
    "Oystersteel", "Yellow Gold", "White Gold", "Everose Gold",
    "Rolesor", "Platinum",
  ],
  "Omega": [
    "Stainless Steel", "Titanium", "Sedna Gold", "Moonshine Gold",
    "Canopus Gold", "Bronze",
  ],
  "Audemars Piguet": [
    "Stainless Steel", "Rose Gold", "Yellow Gold", "White Gold",
    "Titanium", "Platinum", "Ceramic",
  ],
};

export function validateWatch(watch: any): RuleReport {
  const results: RuleResult[] = [];

  // 1. Caliber-reference match
  const validCals = Object.entries(KNOWN_CALIBERS)
    .filter(([_, refs]) => refs.includes(watch.referenceNumber))
    .map(([c]) => c);
  const calOk =
    validCals.length === 0 || validCals.includes(watch.movementCaliber);
  results.push({
    name: "caliber_reference_match",
    passed: calOk,
    score: calOk ? 100 : 0,
    weight: 0.2,
    reason: calOk
      ? `Caliber ${watch.movementCaliber} valid for Ref. ${watch.referenceNumber}`
      : `Caliber ${watch.movementCaliber} does not match Ref. ${watch.referenceNumber} (expected: ${validCals.join("/")})`,
    critical: true,
  });

  // 2. Production year range
  const yr = PRODUCTION_YEARS[watch.referenceNumber];
  const yrOk =
    !yr ||
    (watch.yearOfProduction >= yr[0] && watch.yearOfProduction <= yr[1]);
  results.push({
    name: "production_year",
    passed: yrOk,
    score: yrOk ? 100 : 0,
    weight: 0.15,
    reason: yrOk
      ? `Year ${watch.yearOfProduction} within valid range`
      : `Year ${watch.yearOfProduction} outside production range ${yr?.[0]}-${yr?.[1]} for Ref. ${watch.referenceNumber}`,
    critical: true,
  });

  // 3. Serial number format
  const snOk = watch.serialNumber?.length >= 8;
  results.push({
    name: "serial_format",
    passed: snOk,
    score: snOk ? 100 : 0,
    weight: 0.1,
    reason: snOk
      ? "Serial number format plausible"
      : "Serial number too short or missing",
    critical: false,
  });

  // 4. Service history vs age
  const age = new Date().getFullYear() - Number(watch.yearOfProduction);
  const svcOk = age < 5 || (watch.serviceCount || 0) > 0;
  results.push({
    name: "service_history",
    passed: svcOk,
    score: svcOk ? 100 : age > 10 ? 30 : 60,
    weight: 0.15,
    reason: svcOk
      ? `${watch.serviceCount || 0} service records for ${age}yr watch`
      : `${age}yr watch with no service history`,
    critical: false,
  });

  // 5. Condition vs age consistency
  const condOk = !(age > 15 && watch.conditionGrade === "Excellent");
  results.push({
    name: "condition_age",
    passed: condOk,
    score: condOk ? 100 : 40,
    weight: 0.1,
    reason: condOk
      ? "Condition grade consistent with age"
      : "Excellent grade unusual for 15+ year watch",
    critical: false,
  });

  // 6. Material validation (multi-brand)
  const validMaterials = BRAND_MATERIALS[watch.brand];
  const matOk = !validMaterials || validMaterials.includes(watch.caseMaterial);
  results.push({
    name: "material_valid",
    passed: matOk,
    score: matOk ? 100 : 0,
    weight: 0.15,
    reason: matOk
      ? `"${watch.caseMaterial}" is a valid ${watch.brand} material`
      : `"${watch.caseMaterial}" not recognized for ${watch.brand}`,
    critical: true,
  });

  // 7. Image documentation
  const imgOk = (watch.imageCount || 0) >= 2;
  results.push({
    name: "image_documentation",
    passed: imgOk,
    score: imgOk ? 100 : (watch.imageCount || 0) === 1 ? 50 : 20,
    weight: 0.15,
    reason: imgOk
      ? `${watch.imageCount} photos provided`
      : `Only ${watch.imageCount || 0} photo(s) — minimum 2 recommended`,
    critical: false,
  });

  const totalScore = results.reduce((s, r) => s + r.score * r.weight, 0);
  const criticalFailures = results
    .filter((r) => r.critical && !r.passed)
    .map((r) => r.name);

  return { results, totalScore, criticalFailures };
}
