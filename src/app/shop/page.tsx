
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
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, orderBy, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Autoplay from "embla-carousel-autoplay";
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';


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
    youtubeUrl: string;
    status: 'active' | 'draft';
}

interface CategoryWithProducts extends Category {
    products: Product[];
}

const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};


export default function ShopPage() {
  const firestore = useFirestore();
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const { toast } = useToast();
  
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

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ ...product, quantity: 1 });
    toast({
      title: "تمت الإضافة إلى السلة",
      description: `1x ${product.name}`,
    });
  };

  return (
    <div dir="rtl" className="dark">
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b bg-background/30 p-4 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <ThemeToggleButton />
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-6 w-6 text-primary" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
           <div className="container mx-auto py-6">
                <section className="mb-8">
                     {isLoadingBanners ? (
                        <Skeleton className="aspect-video w-full rounded-xl" />
                    ) : (
                        <Carousel
                            plugins={[Autoplay({ delay: 5000 })]}
                            opts={{ loop: true, direction: 'rtl' }}
                            className="w-full"
                        >
                            <CarouselContent>
                                {banners?.map((banner) => {
                                    const videoId = getYouTubeVideoId(banner.youtubeUrl);
                                    if (!videoId) return null;
                                    
                                    return (
                                        <CarouselItem key={banner.id}>
                                            <div className="overflow-hidden rounded-xl aspect-video w-full">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&autohide=1`}
                                                    frameBorder="0"
                                                    allow="autoplay; encrypted-media"
                                                    allowFullScreen
                                                    className="w-full h-full"
                                                ></iframe>
                                            </div>
                                        </CarouselItem>
                                    );
                                })}
                            </CarouselContent>
                        </Carousel>
                    )}
                </section>
                
                <div className="space-y-12">
                    {isLoading ? (
                        Array.from({length: 3}).map((_, i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-8 w-1/3" />
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    {Array.from({length: 4}).map((_, j) => (
                                        <Card key={j}>
                                            <CardContent className="p-0">
                                                <Skeleton className="w-full h-40" />
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
                            <Carousel
                              opts={{
                                align: "start",
                                dragFree: true,
                                direction: 'rtl'
                              }}
                              className="w-full"
                            >
                              <CarouselContent className="-mr-4">
                                {category.products.map(product => (
                                  <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 pr-4 group">
                                    <Link href={`/product/${product.id}`} className="block h-full">
                                      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:shadow-primary/20 group-hover:shadow-lg">
                                        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                                            <Image
                                                src={product.imageUrl || getImage('category-sweets')}
                                                alt={product.name}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                                data-ai-hint={product.imageHint || product.name}
                                            />
                                        </div>
                                        <div className="p-3 bg-background/80 flex flex-col flex-grow relative">
                                            <h3 className="font-semibold truncate flex-grow mb-2 text-sm">{product.name}</h3>
                                            <div className="flex items-end justify-between">
                                                <p className="text-primary font-bold">{product.price.toFixed(2)} د.ل</p>
                                                <Button size="icon" className="h-8 w-8 shrink-0" onClick={(e) => handleAddToCart(e, product)}>
                                                  <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                      </Card>
                                    </Link>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                            </Carousel>
                        </section>
                    ))}
                </div>
            </div>
        </main>

        <footer className="fixed bottom-0 z-40 w-full border-t border-white/10 bg-background/30 backdrop-blur-lg">
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
              href="/my-wallet"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Wallet className="mb-1 h-6 w-6" />
              محفظتي
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

    