"use server";

import {
  analyzePrivacyRisk,
  type PrivacyRiskAnalysisInput,
  type PrivacyRiskAnalysisOutput,
} from "@/ai/flows/privacy-risk-analysis";

export async function getPrivacyAnalysis(
  input: PrivacyRiskAnalysisInput
): Promise<PrivacyRiskAnalysisOutput> {
  const result = await analyzePrivacyRisk(input);
  return result;
}
