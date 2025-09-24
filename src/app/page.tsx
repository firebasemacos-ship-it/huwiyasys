
'use client';
import Image from 'next/image';
import {
  ChevronDown,
  Home,
  MessageSquare,
  MoreHorizontal,
  Search,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Category = {
  name: string;
  image: string;
  imageHint: string;
};

const categories: Category[] = [
  { name: 'منتجات بريدفاست', image: 'category-snacks', imageHint: 'snacks products' },
  { name: 'عروض وخصومات', image: 'category-deals', imageHint: 'deals coupons' },
  { name: 'صنع في مصر', image: 'category-local', imageHint: 'shop local' },
  { name: 'حلويات وآيس كريم', image: 'category-sweets', imageHint: 'sweets icecream' },
  { name: 'بريدفاست كوفي', image: 'category-coffee', imageHint: 'coffee beans' },
  { name: 'مخبوزات و معجنات', image: 'category-bakery', imageHint: 'bakery pastry' },
];

const brandLogos = [
  { id: 'logo-xprs', imageHint: 'xprs logo' },
  { id: 'logo-tradeline', imageHint: 'tradeline logo' },
  { id: 'logo-mediatech', imageHint: 'mediatech logo' },
];

const promoImages = [
  { id: 'promo-1', imageHint: 'cleaning supplies' },
  { id: 'promo-2', imageHint: 'water bottles' },
];

const getImage = (id: string) => {
    const image = PlaceHolderImages.find((img) => img.id === id);
    return image ? image.imageUrl : 'https://picsum.photos/seed/placeholder/600/400';
};


export default function HomePage() {
  return (
    <div className="bg-background text-foreground font-sans" dir="rtl">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" className="flex items-center gap-2 p-0 text-base font-bold text-purple-600">
                الإسماعيلية
                <ChevronDown className="h-5 w-5" />
              </Button>
              <p className="text-sm text-orange-500">
                التوصيل 10:00 ص - 11:00 ص
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-6 w-6 text-purple-600" />
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
                        <Card className="overflow-hidden rounded-lg">
                        <CardContent className="p-0">
                            <Image
                            src={getImage(promo.id)}
                            alt={promo.imageHint}
                            width={600}
                            height={300}
                            className="aspect-[2/1] w-full object-cover"
                            data-ai-hint={promo.imageHint}
                            />
                        </CardContent>
                        </Card>
                    </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          <section className="py-6 text-center">
            <h2 className="text-2xl font-bold">اكتشف شوبس: أحدث إضافاتنا!</h2>
            <p className="text-muted-foreground">
              توصيل في اليوم التالي من خلال بريدفاست
            </p>
            <div className="mt-4 flex items-center justify-center gap-6 px-4 sm:gap-10">
              {brandLogos.map((logo) => (
                <div key={logo.id} className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-2 shadow-md sm:h-20 sm:w-20">
                    <Image
                    src={getImage(logo.id)}
                    alt={logo.imageHint}
                    width={80}
                    height={80}
                    className="object-contain"
                    data-ai-hint={logo.imageHint}
                    />
                </div>
              ))}
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="mb-4 text-center text-2xl font-bold">
              اكتشف بريدفاست
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {categories.map((category) => (
                <Card
                  key={category.name}
                  className="overflow-hidden rounded-xl bg-yellow-50/50"
                >
                  <CardContent className="flex flex-col items-center p-2 text-center">
                    <p className="mb-2 h-10 text-sm font-semibold">
                      {category.name}
                    </p>
                    <div className="relative h-24 w-full">
                       <Image
                        src={getImage(category.image)}
                        alt={category.name}
                        fill
                        className="object-contain"
                        data-ai-hint={category.imageHint}
                        />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>

        <footer className="fixed bottom-0 z-40 w-full border-t bg-background">
          <nav className="flex items-center justify-around p-2">
            <a
              href="#"
              className="flex flex-col items-center text-xs font-medium text-purple-600"
            >
              <Home className="mb-1 h-6 w-6" />
              الرئيسية
            </a>
            <a
              href="#"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Search className="mb-1 h-6 w-6" />
              البحث
            </a>
            <a
              href="#"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <ShoppingCart className="mb-1 h-6 w-6" />
              السلة
            </a>
            <a
              href="#"
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

    