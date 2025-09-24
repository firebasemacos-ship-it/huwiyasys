// RecommendApps flow implementation.
'use server';

/**
 * @fileOverview Recommends apps based on user preferences and current app usage.
 *
 * - recommendApps - A function that recommends apps to the user.
 * - RecommendAppsInput - The input type for the recommendApps function.
 * - RecommendAppsOutput - The return type for the recommendApps function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendAppsInputSchema = z.object({
  userPreferences: z
    .string()
    .describe('A description of the user preferences.'),
  currentAppUsage: z
    .string()
    .describe('A description of the users current app usage.'),
});
export type RecommendAppsInput = z.infer<typeof RecommendAppsInputSchema>;

const RecommendAppsOutputSchema = z.object({
  recommendedApps: z
    .array(z.string())
    .describe('A list of recommended apps based on user preferences and current app usage.'),
});
export type RecommendAppsOutput = z.infer<typeof RecommendAppsOutputSchema>;

export async function recommendApps(input: RecommendAppsInput): Promise<RecommendAppsOutput> {
  return recommendAppsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendAppsPrompt',
  input: {schema: RecommendAppsInputSchema},
  output: {schema: RecommendAppsOutputSchema},
  prompt: `You are a personal app recommendation assistant. Analyze the user's preferences and current app usage to recommend new and relevant apps.

User Preferences: {{{userPreferences}}}
Current App Usage: {{{currentAppUsage}}}

Based on this information, recommend a list of apps that the user might find interesting. Output an array of app names.

Apps:`,
});

const recommendAppsFlow = ai.defineFlow(
  {
    name: 'recommendAppsFlow',
    inputSchema: RecommendAppsInputSchema,
    outputSchema: RecommendAppsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
