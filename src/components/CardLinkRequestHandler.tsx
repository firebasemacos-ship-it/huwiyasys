
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
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

interface CardLinkRequest {
  id: string;
  requesterName: string;
  requesterId: string;
  ownerId: string;
  cardNumber: string;
  ownerName: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export function CardLinkRequestHandler() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'cardLinkRequests'),
      where('ownerId', '==', user.uid),
      where('status', '==', 'pending')
    );
  }, [firestore, user]);

  const { data: requests, isLoading: areRequestsLoading } = useCollection<CardLinkRequest>(requestsQuery);

  const handleRequest = async (request: CardLinkRequest, newStatus: 'accepted' | 'rejected') => {
    if (!firestore || !user) return;
    
    const requestDocRef = doc(firestore, 'cardLinkRequests', request.id);
    const requesterDocRef = doc(firestore, 'users', request.requesterId);

    try {
      await updateDoc(requestDocRef, { status: newStatus });

      if (newStatus === 'accepted') {
        const linkedWalletData = {
          cardNumber: request.cardNumber,
          ownerName: request.ownerName
        };
        await updateDoc(requesterDocRef, {
            linkedWallets: arrayUnion(linkedWalletData)
        });
        toast({ title: "تمت الموافقة", description: `لقد وافقت على طلب ${request.requesterName}.` });
      } else {
        toast({ title: "تم الرفض", description: `لقد رفضت طلب ${request.requesterName}.`, variant: 'destructive' });
      }
    } catch (error: any) {
      console.error("Error handling request:", error);
      toast({ title: "خطأ", description: "فشل تحديث حالة الطلب.", variant: 'destructive' });
    }
  };

  if (isUserLoading || areRequestsLoading || !requests || requests.length === 0) {
    return null;
  }
  
  // We only show one request at a time to not overwhelm the user.
  const currentRequest = requests[0];

  return (
    <AlertDialog open={true}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>طلب ربط بطاقة</AlertDialogTitle>
          <AlertDialogDescription>
            المستخدم <span className="font-bold">{currentRequest.requesterName}</span> يريد استخدام بطاقتك للدفع. هل توافق؟
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
             <Button onClick={() => handleRequest(currentRequest, 'accepted')}>موافق</Button>
          </AlertDialogAction>
          <AlertDialogCancel asChild>
             <Button variant="destructive" onClick={() => handleRequest(currentRequest, 'rejected')}>رفض</Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
