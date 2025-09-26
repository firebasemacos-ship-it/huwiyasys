'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';

interface Product extends DocumentData {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imageHint?: string;
}

const getImage = (id: string | undefined) => {
    // A placeholder function, assuming you might have a library of placeholders
    return id ? `https://picsum.photos/seed/${id}/500/500` : 'https://picsum.photos/seed/placeholder/500/500';
};

export default function ProductDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const { addItem } = useCart();
  const id = params.id as string;
  
  const firestore = useFirestore();
  const [quantity, setQuantity] = useState(1);

  const productRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'products', id);
  }, [firestore, id]);

  const { data: product, isLoading, error } = useDoc<Product>(productRef);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ ...product, quantity });
    toast({
        title: "تمت الإضافة إلى السلة",
        description: `${quantity}x ${product.name}`,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8" dir="rtl">
        <header className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-24" />
        </header>
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 flex-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return <div className="flex items-center justify-center min-h-screen">حدث خطأ أو المنتج غير موجود.</div>;
  }

  return (
    <div dir="rtl">
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/95 p-4 backdrop-blur">
            <h1 className="text-xl font-bold truncate">{product.name}</h1>
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            </header>

             <main className="flex-1 overflow-y-auto bg-muted/20 pb-32">
                <div className="w-full aspect-square relative mb-4">
                    <Image
                        src={product.imageUrl || getImage(product.imageHint)}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                    />
                </div>
                
                <div className="bg-background p-4 rounded-t-2xl -mt-6 relative z-10 space-y-4">
                     <h2 className="text-3xl font-bold">{product.name}</h2>
                     <p className="text-2xl font-bold text-primary">{product.price.toFixed(2)} د.ل</p>

                     {product.description && (
                        <div className="prose prose-sm dark:prose-invert text-muted-foreground max-w-none">
                            <h3 className="font-semibold text-foreground">الوصف</h3>
                            <p style={{ whiteSpace: 'pre-wrap' }}>
                                {product.description}
                            </p>
                        </div>
                     )}
                </div>
             </main>
             
             <div className="fixed bottom-0 z-40 w-full bg-background p-4 shadow-t-strong">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-full border p-1">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setQuantity(q => q + 1)}>
                            <Plus className="h-5 w-5" />
                        </Button>
                        <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                         <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                            <Minus className="h-5 w-5" />
                        </Button>
                    </div>
                    <Button size="lg" className="w-full text-lg" onClick={handleAddToCart}>
                        <ShoppingCart className="ml-2 h-5 w-5" />
                        إضافة إلى السلة
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}
