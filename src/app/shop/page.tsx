
'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Home,
  MessageSquare,
  MoreHorizontal,
  Search,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, orderBy, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const getImage = (id: string) => {
    const image = PlaceHolderImages.find((img) => img.id === id);
    return image ? image.imageUrl : 'https://picsum.photos/seed/placeholder/600/400';
};

interface Product extends DocumentData {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  imageHint?: string;
  categoryId: string;
}

interface Category extends DocumentData {
  id: string;
  name: string;
  imageUrl?: string;
  imageHint?: string;
}

interface CategoryWithProducts extends Category {
    products: Product[];
}


export default function ShopPage() {
  const firestore = useFirestore();
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const categoriesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'categories'), orderBy('name'));
  }, [firestore]);
  
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  useEffect(() => {
    const fetchProductsForCategories = async () => {
        if (!categories || categories.length === 0 || !firestore) {
            if(!isLoadingCategories) setIsLoading(false);
            return;
        };

        setIsLoading(true);
        const categoriesData: CategoryWithProducts[] = [];

        for (const category of categories) {
            const productsQuery = query(collection(firestore, 'products'), where('categoryId', '==', category.id), where('status', '==', 'active'));
            const productsSnapshot = await getDocs(productsQuery);
            const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            categoriesData.push({ ...category, products });
        }
        
        setCategoriesWithProducts(categoriesData);
        setIsLoading(false);
    }

    fetchProductsForCategories();

  }, [categories, firestore, isLoadingCategories]);


  return (
    <div dir="rtl">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 p-4 backdrop-blur">
          <div className="flex items-center justify-end">
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-6 w-6 text-primary" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
           <div className="space-y-8 px-4 py-6">
                {isLoading ? (
                    Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-8 w-1/3" />
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {Array.from({length: 4}).map((_, j) => (
                                     <Card key={j}>
                                        <CardContent className="p-0">
                                            <Skeleton className="w-full h-32" />
                                            <div className="p-4 space-y-2">
                                                <Skeleton className="h-4 w-4/5" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </div>
                                        </CardContent>
                                     </Card>
                                ))}
                            </div>
                        </div>
                    ))
                ) : categoriesWithProducts.filter(cat => cat.products.length > 0).map(category => (
                    <section key={category.id}>
                        <h2 className="mb-4 text-2xl font-bold">{category.name}</h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {category.products.map(product => (
                                <Link href={`/product/${product.id}`} key={product.id}>
                                    <Card className="overflow-hidden h-full">
                                        <CardContent className="p-0 flex flex-col h-full">
                                            <div className='relative w-full aspect-square'>
                                            <Image 
                                                src={product.imageUrl || getImage('category-sweets')} 
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                                data-ai-hint={product.imageHint || product.name}
                                            />
                                            </div>
                                            <div className="p-4 flex flex-col flex-grow">
                                                <h3 className="font-semibold truncate flex-grow">{product.name}</h3>
                                                <p className="text-primary font-bold mt-2">{product.price.toFixed(2)} د.ل</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

        </main>

        <footer className="fixed bottom-0 z-40 w-full border-t bg-background">
          <nav className="flex items-center justify-around p-2">
            <a
              href="/shop"
              className="flex flex-col items-center text-xs font-medium text-primary"
            >
              <Home className="mb-1 h-6 w-6" />
              الرئيسية
            </a>
            <a
              href="/search"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Search className="mb-1 h-6 w-6" />
              البحث
            </a>
            <a
              href="/cart"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <ShoppingCart className="mb-1 h-6 w-6" />
              السلة
            </a>
            <a
              href="/wallet"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Wallet className="mb-1 h-6 w-6" />
              باي
            </a>
            <a
              href="#"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <MoreHorizontal className="mb-1 h-6 w-6" />
              المزيد
            </a>
          </nav>
        </footer>
      </div>
    </div>
  );
}
