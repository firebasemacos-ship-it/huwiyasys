'use server';

/**
 * @fileOverview Analyzes the privacy risks of installed apps and provides insights into potential privacy issues.
 *
 * - analyzePrivacyRisk - A function that analyzes the privacy risks of an app.
 * - PrivacyRiskAnalysisInput - The input type for the analyzePrivacyRisk function.
 * - PrivacyRiskAnalysisOutput - The return type for the analyzePrivacyRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrivacyRiskAnalysisInputSchema = z.object({
  appName: z.string().describe('The name of the app to analyze.'),
  appPermissions: z.array(z.string()).describe('A list of permissions the app has.'),
  appDescription: z.string().describe('A description of what the app does.'),
});
export type PrivacyRiskAnalysisInput = z.infer<typeof PrivacyRiskAnalysisInputSchema>;

const PrivacyRiskAnalysisOutputSchema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high']).describe('The overall risk level of the app.'),
  summary: z.string().describe('A summary of the privacy risks associated with the app.'),
  detailedRisks: z.array(z.string()).describe('A list of detailed privacy risks identified.'),
  recommendations: z.array(z.string()).describe('Recommendations for the user to mitigate the risks.'),
});
export type PrivacyRiskAnalysisOutput = z.infer<typeof PrivacyRiskAnalysisOutputSchema>;

export async function analyzePrivacyRisk(
  input: PrivacyRiskAnalysisInput
): Promise<PrivacyRiskAnalysisOutput> {
  return analyzePrivacyRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'privacyRiskAnalysisPrompt',
  input: {schema: PrivacyRiskAnalysisInputSchema},
  output: {schema: PrivacyRiskAnalysisOutputSchema},
  prompt: `You are a privacy expert analyzing the potential risks of Android applications.

  Analyze the app based on its name, description and requested permissions to determine if it poses a privacy risk to the user.

  App Name: {{appName}}
  App Description: {{appDescription}}
  App Permissions: {{appPermissions}}

  Based on the information provided, assess the risk level (low, medium, or high), summarize the privacy risks, provide a detailed list of risks, and give recommendations to the user.

  Make sure that riskLevel, summary, detailedRisks and recommendations fields are populated.
  `,
});

const analyzePrivacyRiskFlow = ai.defineFlow(
  {
    name: 'analyzePrivacyRiskFlow',
    inputSchema: PrivacyRiskAnalysisInputSchema,
    outputSchema: PrivacyRiskAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
