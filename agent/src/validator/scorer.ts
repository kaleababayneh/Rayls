import type { RuleReport } from "./rules.js";
import type { LLMAnalysis } from "./llm.js";

export interface FinalScore {
  overall: number;
  ruleScore: number;
  llmScore: number;
  passed: boolean;
  criticalFailures: string[];
  summary: string;
}

export function calculateScore(
  ruleReport: RuleReport,
  llmAnalysis: LLMAnalysis
): FinalScore {
  const overall = Math.round(
    ruleReport.totalScore * 0.6 + llmAnalysis.score * 0.4
  );

  return {
    overall,
    ruleScore: Math.round(ruleReport.totalScore),
    llmScore: llmAnalysis.score,
    passed: ruleReport.criticalFailures.length === 0 && overall >= 70,
    criticalFailures: ruleReport.criticalFailures,
    summary: llmAnalysis.summary,
  };
}
