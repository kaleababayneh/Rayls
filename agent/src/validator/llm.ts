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

  const prompt = `Analyze this luxury watch for authenticity. Return ONLY raw JSON, no markdown, no explanation.

Brand: ${watch.brand} | Model: ${watch.model} | Ref: ${watch.referenceNumber}
Year: ${watch.yearOfProduction} | Caliber: ${watch.movementCaliber}
Case: ${watch.caseMaterial} ${watch.caseDiameterMM}mm | Dial: ${watch.dialColor} | Bracelet: ${watch.braceletType}
Condition: ${watch.conditionGrade} — ${watch.conditionNotes}
Owners: ${watch.ownerCount} | Photos: ${watch.imageCount || 0} | Services: ${watch.serviceCount || 0} | Value: ${watch.appraisedValue}

Check: spec consistency, frankenwatch indicators, provenance plausibility, red flags.

Return this exact JSON format:
{"score":85,"findings":["finding1","finding2"],"riskFlags":[],"summary":"One paragraph assessment."}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      { role: "user", content: prompt },
      { role: "assistant", content: "{" },
    ],
  });

  const text = "{" + response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("  LLM raw response:", text.slice(0, 200));
    return { score: 75, findings: ["LLM analysis unavailable"], riskFlags: [], summary: "Automated rule-based scoring applied. LLM analysis could not be parsed." };
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    console.error("  LLM JSON parse error:", match[0].slice(0, 200));
    return { score: 75, findings: ["LLM response malformed"], riskFlags: [], summary: "Automated rule-based scoring applied. LLM response could not be parsed." };
  }
}
