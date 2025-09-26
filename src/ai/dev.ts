'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/recommend-apps.ts';
import '@/ai/flows/privacy-risk-analysis.ts';
import '@/ai/flows/process-payment-flow.ts';
import '@/ai/flows/find-card-owner-flow.ts';
