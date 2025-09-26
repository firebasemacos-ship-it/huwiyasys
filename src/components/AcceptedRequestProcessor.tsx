
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface CardLinkRequest {
  id: string;
  requesterId: string;
  ownerName: string;
  cardNumber: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export function AcceptedRequestProcessor() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const acceptedRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'cardLinkRequests'),
      where('requesterId', '==', user.uid),
      where('status', '==', 'accepted')
    );
  }, [firestore, user]);

  const { data: acceptedRequests, isLoading: areRequestsLoading } = useCollection<CardLinkRequest>(acceptedRequestsQuery);

  useEffect(() => {
    if (!acceptedRequests || acceptedRequests.length === 0 || !firestore || !user) {
      return;
    }

    const processRequests = async () => {
      const batch = writeBatch(firestore);
      const requesterDocRef = doc(firestore, 'users', user.uid);

      for (const request of acceptedRequests) {
        // 1. Add linked wallet to the requester's user document
        const linkedWalletData = {
          cardNumber: request.cardNumber,
          ownerName: request.ownerName,
        };
        batch.update(requesterDocRef, {
          linkedWallets: arrayUnion(linkedWalletData)
        });

        // 2. Mark the request as 'completed' so it's not processed again
        const requestDocRef = doc(firestore, 'cardLinkRequests', request.id);
        batch.update(requestDocRef, { status: 'completed' });
      }

      try {
        await batch.commit();
        if (acceptedRequests.length > 0) {
            toast({
                title: "تم ربط البطاقات بنجاح",
                description: `تمت إضافة ${acceptedRequests.length} بطاقة جديدة إلى طرق الدفع الخاصة بك.`
            });
        }
      } catch (error) {
        console.error("Error processing accepted requests:", error);
        toast({
            title: "خطأ في ربط البطاقة",
            description: "فشل تحديث بياناتك. الرجاء المحاولة مرة أخرى.",
            variant: "destructive"
        });
      }
    };

    processRequests();

  }, [acceptedRequests, firestore, user, toast]);

  // This component does not render anything
  return null;
}
