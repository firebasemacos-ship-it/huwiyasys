
'use server';
/**
 * @fileOverview A server-side flow to securely find the owner of a given card number.
 *
 * - findCardOwner - A function that finds a user by their wallet card number.
 * - FindCardOwnerInput - The input type for the findCardOwner function.
 * - FindCardOwnerOutput - The return type for the findCardOwner function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server';

// Define input schema for the flow
const FindCardOwnerInputSchema = z.object({
  cardNumber: z.string().describe("The 16-digit card number to search for."),
});
export type FindCardOwnerInput = z.infer<typeof FindCardOwnerInputSchema>;

// Define output schema for the flow
const FindCardOwnerOutputSchema = z.object({
  ownerId: z.string().optional().describe("The UID of the card owner, if found."),
  ownerName: z.string().optional().describe("The display name of the card owner, if found."),
  error: z.string().optional().describe("An error message if the user is not found or another error occurs.")
});
export type FindCardOwnerOutput = z.infer<typeof FindCardOwnerOutputSchema>;


// Exported function that clients will call
export async function findCardOwner(input: FindCardOwnerInput): Promise<FindCardOwnerOutput> {
  return findCardOwnerFlow(input);
}

// Define the main Genkit flow
const findCardOwnerFlow = ai.defineFlow(
  {
    name: 'findCardOwnerFlow',
    inputSchema: FindCardOwnerInputSchema,
    outputSchema: FindCardOwnerOutputSchema,
  },
  async (input) => {
    // IMPORTANT: Initialize Firebase on the server for admin-like privileges
    const { firestore } = initializeFirebase();
    const { cardNumber } = input;

    try {
        const usersRef = collection(firestore, 'users');
        const cardQuery = query(usersRef, where("wallet.cardNumber", "==", cardNumber));
        const cardOwnerSnapshot = await getDocs(cardQuery);

        if (cardOwnerSnapshot.empty) {
            return { error: "لم يتم العثور على مستخدم بهذه البطاقة." };
        }

        const cardOwnerDoc = cardOwnerSnapshot.docs[0];
        const cardOwnerId = cardOwnerDoc.id;
        const cardOwnerData = cardOwnerDoc.data();

        return {
            ownerId: cardOwnerId,
            ownerName: cardOwnerData.displayName,
        };

    } catch (error: any) {
      console.error("Find Card Owner Flow Error:", error);
      // Return a structured error response
      return { error: error.message || "حدث خطأ غير متوقع أثناء البحث." };
    }
  }
);
