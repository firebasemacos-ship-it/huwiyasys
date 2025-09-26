
'use server';
/**
 * @fileOverview A secure payment processing flow.
 *
 * - processPayment - A function that handles the entire payment and order creation process.
 * - ProcessPaymentInput - The input type for the processPayment function.
 * - ProcessPaymentOutput - The return type for the processPayment function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, collection, runTransaction, serverTimestamp, where, query, getDocs, increment, writeBatch } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server';

// Define input schema for the payment flow
const ProcessPaymentInputSchema = z.object({
  buyerId: z.string().describe("The UID of the user making the purchase."),
  buyerName: z.string().describe("The name of the user making the purchase."),
  cartItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
  })).describe("The items in the shopping cart."),
  totalAmount: z.number().describe("The total amount of the order."),
  paymentCard: z.object({
    type: z.enum(['primary', 'linked', 'new']).describe("The type of card used for payment."),
    cardNumber: z.string().describe("The card number used for payment."),
    cvv: z.string().optional().describe("The 3-digit CVV code (for new cards)."),
    expiryDate: z.string().optional().describe("The card's expiration date in MM/YY format (for new cards)."),
  }).describe("Details of the payment card."),
});
export type ProcessPaymentInput = z.infer<typeof ProcessPaymentInputSchema>;

// Define output schema for the payment flow
const ProcessPaymentOutputSchema = z.object({
  success: z.boolean().describe("Whether the payment was successful."),
  orderId: z.string().optional().describe("The ID of the created order if successful."),
  message: z.string().describe("A message detailing the outcome."),
});
export type ProcessPaymentOutput = z.infer<typeof ProcessPaymentOutputSchema>;

// Exported function that clients will call
export async function processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentOutput> {
  return processPaymentFlow(input);
}


// Define the main Genkit flow
const processPaymentFlow = ai.defineFlow(
  {
    name: 'processPaymentFlow',
    inputSchema: ProcessPaymentInputSchema,
    outputSchema: ProcessPaymentOutputSchema,
  },
  async (input) => {
    // IMPORTANT: Initialize Firebase on the server for admin-like privileges
    const { firestore } = initializeFirebase();
    const { buyerId, buyerName, cartItems, totalAmount, paymentCard } = input;

    try {
      // --- 1. Find and Verify Card Owner ---
      const usersRef = collection(firestore, 'users');
      const cardQuery = query(usersRef, where("wallet.cardNumber", "==", paymentCard.cardNumber));
      const cardOwnerSnapshot = await getDocs(cardQuery);

      if (cardOwnerSnapshot.empty) {
        throw new Error("لم يتم العثور على البطاقة المحددة.");
      }

      const cardOwnerDoc = cardOwnerSnapshot.docs[0];
      const cardOwnerId = cardOwnerDoc.id;
      const cardOwnerData = cardOwnerDoc.data();

      // --- 2. Validate Card Details and Balance ---
      if (paymentCard.type === 'new') {
        if (cardOwnerData.wallet.cvv !== paymentCard.cvv || cardOwnerData.wallet.expiryDate !== paymentCard.expiryDate) {
          throw new Error("بيانات البطاقة (CVV أو تاريخ الانتهاء) غير صحيحة.");
        }
      }
      
      if (cardOwnerData.wallet.status !== 'active') {
           throw new Error(`بطاقة ${cardOwnerData.displayName} معلقة حاليًا.`);
      }
      if (cardOwnerData.wallet.balance < totalAmount) {
        throw new Error(`الرصيد في بطاقة ${cardOwnerData.displayName} غير كافٍ.`);
      }

      // --- 3. Perform Firestore Writes within a Batch ---
      const batch = writeBatch(firestore);
      
      const cardOwnerRef = doc(firestore, 'users', cardOwnerId);
      
      // a. Debit the card owner's wallet
      batch.update(cardOwnerRef, { "wallet.balance": increment(-totalAmount) });

      // b. Create transaction log for the card owner
      const ownerTransactionRef = doc(collection(firestore, `users/${cardOwnerId}/transactions`));
      batch.set(ownerTransactionRef, {
          type: 'شراء',
          amount: -totalAmount,
          date: serverTimestamp(),
          description: cardOwnerId === buyerId 
              ? `شراء منتجات من التطبيق` 
              : `شراء منتجات من قبل المستخدم ${buyerName} (${buyerId.slice(0,5)}...)`
      });
      
      // c. Create transaction log for the buyer (if different from owner)
      if (cardOwnerId !== buyerId) {
          const buyerTransactionRef = doc(collection(firestore, `users/${buyerId}/transactions`));
          batch.set(buyerTransactionRef, {
              type: 'شراء',
              amount: 0, // Buyer's own balance is not affected
              date: serverTimestamp(),
              description: `تم الدفع باستخدام بطاقة ${cardOwnerData.displayName}`
          });
      }

      // d. Create the order document
      const orderRef = doc(collection(firestore, 'orders'));
      batch.set(orderRef, {
          userId: buyerId,
          userName: buyerName,
          items: cartItems,
          totalAmount: totalAmount,
          status: 'pending',
          paymentMethod: `**** ${paymentCard.cardNumber.slice(-4)}`,
          createdAt: serverTimestamp(),
      });

      await batch.commit();
      
      return { success: true, orderId: orderRef.id, message: "تم الدفع بنجاح!" };

    } catch (error: any) {
      console.error("Payment Flow Error:", error);
      // Return a structured error response
      return { success: false, message: error.message || "حدث خطأ غير متوقع أثناء معالجة الدفع." };
    }
  }
);
