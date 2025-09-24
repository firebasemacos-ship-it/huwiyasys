"use server";

import { recommendApps, type RecommendAppsInput, type RecommendAppsOutput } from "@/ai/flows/recommend-apps";

export async function getRecommendations(input: RecommendAppsInput): Promise<RecommendAppsOutput> {
  const result = await recommendApps(input);
  return result;
}
