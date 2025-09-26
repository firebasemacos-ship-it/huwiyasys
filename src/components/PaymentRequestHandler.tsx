
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, writeBatch, serverTimestamp, increment, addDoc, runTransaction, arrayUnion } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { v4 as uuidv4 } from 'uuid';


interface PaymentRequest {
  id: string;
  requesterName: string;
  requesterId: string;
  ownerId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  orderData: any;
}

export function PaymentRequestHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeRequest, setActiveRequest] = useState<PaymentRequest | null>(null);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'paymentRequests'),
      where('ownerId', '==', user.uid),
      where('status', '==', 'pending')
    );
  }, [firestore, user]);

  const { data: requests } = useCollection<PaymentRequest>(requestsQuery);

  useEffect(() => {
    if (requests && requests.length > 0 && !activeRequest) {
      setActiveRequest(requests[0]);
    }
  }, [requests, activeRequest]);

  const handleResponse = async (approved: boolean) => {
    if (!activeRequest || !firestore || !user) return;

    const requestDocRef = doc(firestore, 'paymentRequests', activeRequest.id);
    
    if (approved) {
      try {
        // Use a transaction to ensure atomicity
        await runTransaction(firestore, async (transaction) => {
            const ownerDocRef = doc(firestore, 'users', user.uid);
            const requesterDocRef = doc(firestore, 'users', activeRequest.requesterId);

            const ownerDoc = await transaction.get(ownerDocRef);

            if (!ownerDoc.exists()) {
                throw new Error("لا يمكن العثور على بياناتك.");
            }
            const ownerData = ownerDoc.data();
            if (ownerData.wallet.balance < activeRequest.amount) {
                throw new Error("رصيدك غير كافٍ لإتمام هذه العملية.");
            }

            // 1. Debit the owner's wallet
            transaction.update(ownerDocRef, { "wallet.balance": increment(-activeRequest.amount) });
            
            // 2. Create transaction log for the owner
            const ownerTransactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
            transaction.set(ownerTransactionRef, {
                type: 'شراء',
                amount: -activeRequest.amount,
                date: serverTimestamp(),
                description: `شراء منتجات من قبل المستخدم ${activeRequest.requesterName}`
            });

            // 3. Create the final order
            const orderRef = doc(collection(firestore, 'orders'));
            transaction.set(orderRef, { ...activeRequest.orderData, status: 'pending', createdAt: serverTimestamp() });
            
            // 4. Mark the request as processed
            transaction.update(requestDocRef, { status: 'processed' });

            // 5. Add order subscription to requester
            const orderSubscription = {
                id: uuidv4(),
                category: 'order',
                status: 'reviewing',
                orderName: `طلب منتجات متنوعة`,
                orderId: orderRef.id,
                totalAmount: activeRequest.amount,
                itemCount: activeRequest.orderData.items.reduce((acc: number, item: any) => acc + item.quantity, 0),
                createdAt: serverTimestamp(),
            };
            transaction.update(requesterDocRef, { subscriptions: arrayUnion(orderSubscription) });

        });

        toast({ title: "تمت الموافقة", description: `تم خصم المبلغ وإنشاء الطلب.` });

      } catch (error: any) {
        console.error("Error processing payment approval:", error);
        toast({ title: "خطأ في المعالجة", description: error.message, variant: 'destructive' });
        // Reject the request if transaction fails
        await updateDoc(requestDocRef, { status: 'rejected' });
      }

    } else { // If rejected
      await updateDoc(requestDocRef, { status: 'rejected' });
      toast({ title: "تم الرفض", variant: 'destructive' });
    }

    setActiveRequest(null); // Dismiss the dialog
  };

  if (!activeRequest) {
    return null;
  }

  return (
    <AlertDialog open={!!activeRequest} onOpenChange={() => setActiveRequest(null)}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>طلب موافقة على الدفع</AlertDialogTitle>
          <AlertDialogDescription>
            المستخدم <span className="font-bold">{activeRequest.requesterName}</span> يريد إجراء عملية شراء بقيمة 
            <span className="font-bold text-primary"> {activeRequest.amount.toFixed(2)} د.ل </span> 
            باستخدام بطاقتك. هل توافق على خصم المبلغ من رصيدك؟
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
             <Button onClick={() => handleResponse(true)}>موافق وادفع</Button>
          </AlertDialogAction>
          <AlertDialogCancel asChild>
             <Button variant="destructive" onClick={() => handleResponse(false)}>رفض</Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
