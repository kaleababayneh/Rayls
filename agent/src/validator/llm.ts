import Anthropic from "@anthropic-ai/sdk";

export interface LLMAnalysis {
  score: number;
  findings: string[];
  riskFlags: string[];
  summary: string;
}

export async function analyzeWatch(watch: any): Promise<LLMAnalysis> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are a luxury watch authentication AI oracle for a blockchain attestation system. Analyze this watch listing for authenticity indicators.

WATCH DATA:
- Brand: ${watch.brand}
- Model: ${watch.model}
- Reference: ${watch.referenceNumber}
- Year of Production: ${watch.yearOfProduction}
- Movement Caliber: ${watch.movementCaliber}
- Case: ${watch.caseMaterial} ${watch.caseDiameterMM}mm
- Dial: ${watch.dialColor}
- Bracelet: ${watch.braceletType}
- Condition: ${watch.conditionGrade} — ${watch.conditionNotes}
- Owner Count: ${watch.ownerCount}
- Photos: ${watch.imageCount || 0}
- Service Records: ${watch.serviceCount || 0}
- Appraised Value: ${watch.appraisedValue}

EVALUATE:
1) Specification consistency (caliber, case size, reference compatibility)
2) Frankenwatch indicators (mismatched parts across eras)
3) Ownership and provenance pattern plausibility
4) Red flags or unusual claims

Respond ONLY with a JSON object in this exact format:
{"score": <0-100>, "findings": ["finding1", "finding2"], "riskFlags": ["flag1"], "summary": "<one paragraph public-safe assessment>"}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Failed to parse LLM response");
  return JSON.parse(match[0]);
}
