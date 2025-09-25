
'use client';
import Image from 'next/image';
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

const promoImages = [
  { id: 'promo-1', imageHint: 'cleaning supplies', title: 'عروض الصيف', description: 'خصومات تصل إلى 50% على منتجات التنظيف' },
  { id: 'promo-2', imageHint: 'water bottles', title: 'ابق منتعشاً', description: 'عروض خاصة على عبوات المياه' },
];

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
            const productsQuery = query(collection(firestore, 'products'), where('categoryId', '==', category.id));
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
          <div className="container mx-auto px-4 py-4">
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {promoImages.map((promo) => (
                    <CarouselItem key={promo.id} className="basis-5/6 pl-2">
                        <Card className="overflow-hidden rounded-xl relative border-none shadow-none">
                        <CardContent className="p-0">
                            <Image
                            src={getImage(promo.id)}
                            alt={promo.imageHint}
                            width={600}
                            height={300}
                            className="aspect-[2/1] w-full object-cover rounded-xl"
                            data-ai-hint={promo.imageHint}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4 md:p-6">
                              <h3 className="text-white text-xl md:text-2xl font-bold">{promo.title}</h3>
                              <p className="text-white/90 text-sm md:text-base">{promo.description}</p>
                            </div>
                        </CardContent>
                        </Card>
                    </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
          
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
                                <Card key={product.id} className="overflow-hidden">
                                     <CardContent className="p-0">
                                        <Image 
                                            src={product.imageUrl || getImage('category-sweets')} 
                                            alt={product.name}
                                            width={500}
                                            height={500}
                                            className="object-cover w-full aspect-square"
                                            data-ai-hint={product.imageHint || product.name}
                                        />
                                        <div className="p-4">
                                            <h3 className="font-semibold truncate">{product.name}</h3>
                                            <p className="text-primary font-bold">{product.price.toFixed(2)} د.ل</p>
                                        </div>
                                    </CardContent>
                                </Card>
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
