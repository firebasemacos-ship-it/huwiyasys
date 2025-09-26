'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/recommend-apps.ts';
import '@/ai/flows/privacy-risk-analysis.ts';
import '@/ai/flows/process-payment-flow.ts';
