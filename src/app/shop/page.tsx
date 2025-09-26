
'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Home,
  MessageSquare,
  Ticket,
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
import Autoplay from "embla-carousel-autoplay";


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

interface Banner extends DocumentData {
    id: string;
    title: string;
    imageUrl: string;
    link?: string;
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

  const bannersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'banners'), where('status', '==', 'active'));
  }, [firestore]);
  
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);
  const { data: banners, isLoading: isLoadingBanners } = useCollection<Banner>(bannersQuery);

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
           <div className="container mx-auto py-6">
                <section className="mb-8">
                     {isLoadingBanners ? (
                        <Skeleton className="aspect-[2/1] w-full rounded-xl" />
                    ) : (
                        <Carousel
                            plugins={[Autoplay({ delay: 5000 })]}
                            opts={{ loop: true }}
                            className="w-full"
                        >
                            <CarouselContent>
                                {banners?.map((banner) => (
                                <CarouselItem key={banner.id}>
                                    <Link href={banner.link || '#'}>
                                        <Card className="overflow-hidden">
                                            <CardContent className="p-0">
                                            <Image
                                                src={banner.imageUrl}
                                                alt={banner.title}
                                                width={1200}
                                                height={600}
                                                className="w-full object-cover aspect-[2/1]"
                                            />
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    )}
                </section>
                
                <div className="space-y-8">
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
                                    <Link href={`/product/${product.id}`} key={product.id} className="h-full">
                                        <div className="relative flex flex-col h-full overflow-hidden rounded-lg bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-200">
                                            <div className="relative w-full aspect-[4/3] bg-muted">
                                                <Image
                                                    src={product.imageUrl || getImage('category-sweets')}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                                    data-ai-hint={product.imageHint || product.name}
                                                />
                                            </div>
                                            <div className="relative p-4 flex flex-col flex-grow bg-card">
                                                <div className="absolute top-0 left-0 right-0 h-px bg-transparent -translate-y-1/2">
                                                    <div className="absolute top-0 left-0 right-0 h-full bg-card" style={{
                                                        maskImage: 'radial-gradient(circle at 0 0, transparent 0.5rem, black 0.5rem), radial-gradient(circle at 100% 0, transparent 0.5rem, black 0.5rem)',
                                                        maskComposite: 'intersect',
                                                    }}>
                                                        <div className="border-t border-dashed border-border h-full"></div>
                                                    </div>
                                                </div>
                                                <div className="absolute -top-3 -left-3 w-6 h-6 bg-background rounded-full"></div>
                                                <div className="absolute -top-3 -right-3 w-6 h-6 bg-background rounded-full"></div>

                                                <h3 className="font-semibold truncate flex-grow">{product.name}</h3>
                                                <p className="text-primary font-bold mt-2">{product.price.toFixed(2)} د.ل</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
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
              href="/subscriptions"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Ticket className="mb-1 h-6 w-6" />
              الاشتراكات
            </a>
          </nav>
        </footer>
      </div>
    </div>
  );
}
