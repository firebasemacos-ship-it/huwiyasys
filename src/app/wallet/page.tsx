
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Home, MoreHorizontal, Search, ShoppingCart, Wallet as WalletIcon, ArrowLeft, CreditCard, Gift, PlusCircle, LoaderCircle, CheckCircle2, Wifi } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons';


const initialTransactions = [
  { id: 1, type: 'شحن رصيد', amount: 200.00, date: '25 يوليو 2024' },
  { id: 2, type: 'طلب رقم #1234', amount: -75.50, date: '24 يوليو 2024' },
  { id: 3, type: 'هدية من صديق', amount: 50.00, date: '22 يوليو 2024' },
  { id: 4, type: 'طلب رقم #1211', amount: -120.00, date: '21 يوليو 2024' },
];

export default function WalletPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [rechargeCode, setRechargeCode] = useState('');
  const [rechargeStatus, setRechargeStatus] = useState('idle'); // idle, verifying, charging, success
  const [displayBalance, setDisplayBalance] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const currentBalance = useMemo(() => transactions.reduce((acc, t) => acc + t.amount, 0), [transactions]);

  useEffect(() => {
    let animationFrameId: number;
    let current = 0;
    const target = currentBalance;
    const step = (target - current) / 100; // Animate over ~100 frames

    const animate = () => {
      current += step;
      if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
        setDisplayBalance(target);
        cancelAnimationFrame(animationFrameId);
      } else {
        setDisplayBalance(current);
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    if (Math.abs(target - displayBalance) > 0.01) {
        animationFrameId = requestAnimationFrame(animate);
    } else {
        setDisplayBalance(target);
    }


    return () => cancelAnimationFrame(animationFrameId);
  }, [currentBalance]);


  const handleRecharge = () => {
    if (!rechargeCode.trim()) {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "الرجاء إدخال رمز كرت التعبئة.",
        });
        return;
    }
    
    setRechargeStatus('verifying');

    setTimeout(() => {
        setRechargeStatus('charging');
        setTimeout(() => {
            const rechargeAmount = 100.00;
            const newTransaction = {
                id: transactions.length + 1,
                type: 'شحن رصيد',
                amount: rechargeAmount,
                date: new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' })
            };
            setTransactions([newTransaction, ...transactions]);
            
            setRechargeStatus('success');
            setTimeout(() => {
                setDialogOpen(false);
                toast({
                    title: "تم الشحن بنجاح",
                    description: `تمت إضافة ${rechargeAmount.toFixed(2)} دينار ليبي إلى محفظتك.`,
                });
                setTimeout(() => {
                    setRechargeStatus('idle');
                    setRechargeCode('');
                }, 500);
            }, 2000);
        }, 2000); 
    }, 2000);
  }

  const { Icon, message } = useMemo(() => {
      switch (rechargeStatus) {
          case 'verifying':
              return { Icon: () => <LoaderCircle className="h-16 w-16 animate-spin text-primary" />, message: 'جاري التحقق من كرت التعبئة...' };
          case 'charging':
              return { Icon: () => <LoaderCircle className="h-16 w-16 animate-spin text-primary" />, message: 'جاري شحن المحفظة...' };
          case 'success':
              return { Icon: () => <CheckCircle2 className="h-16 w-16 text-green-500" />, message: 'تمت إضافة الرصيد بنجاح!' };
          default:
              return { Icon: () => <Gift className="h-16 w-16 text-muted-foreground" />, message: 'أدخل رمز كرت التعبئة لشحن محفظتك.' };
      }
  }, [rechargeStatus]);


  return (
    <div className="bg-background text-foreground font-sans" dir="rtl">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/95 p-4 backdrop-blur">
          <h1 className="text-xl font-bold">المحفظة</h1>
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 pb-24">
            <div className="mb-6 mx-auto max-w-sm" style={{ perspective: '1000px' }}>
                <div 
                    className={cn("relative w-full aspect-[1.586] transition-transform duration-700")}
                    style={{ transformStyle: 'preserve-3d', transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                >
                    {/* Card Front */}
                    <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
                        <Card className="relative h-full w-full overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-lg">
                            <CardContent className="flex h-full flex-col justify-between p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 pointer-events-none">
                                        <Logo className="h-8 w-8 text-primary-foreground" />
                                        <span className="text-lg font-bold">Mobile Mate</span>
                                    </div>
                                    <Wifi className="h-6 w-6 -rotate-90 opacity-70" />
                                </div>
                                <div className="text-left">
                                    <p className="font-mono text-xl tracking-widest">
                                        5432 1098 7654 3456
                                    </p>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-sm opacity-80">الرصيد الحالي</p>
                                        <p className="text-3xl font-bold leading-tight">{displayBalance.toFixed(2)}</p>
                                        <p className="text-sm font-medium opacity-90">دينار ليبي</p>
                                    </div>
                                    <p className="text-sm font-semibold">08/30</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Card Back */}
                    <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <Card className="relative h-full w-full overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-lg">
                            <div className="h-full flex flex-col justify-between p-4">
                                <div className="h-12 bg-black mt-4"></div>
                                <div className="flex justify-end items-center gap-4 px-4 py-2 bg-slate-200 rounded-md">
                                    <p className="font-mono text-lg text-black italic">123</p>
                                    <p className="text-sm text-slate-600 flex-1 text-right">CVV</p>
                                </div>
                                <div className="text-xs opacity-70 text-left p-2">
                                    <p>انقر للعودة</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
              if (!isOpen) {
                setTimeout(() => {
                    setRechargeStatus('idle');
                    setRechargeCode('');
                }, 500);
              }
              setDialogOpen(isOpen);
          }}>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full">
                    <PlusCircle className="ml-2 h-5 w-5" />
                    شحن الرصيد
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl">شحن الرصيد</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
                    <div className="flex h-32 w-32 items-center justify-center">
                       <Icon />
                    </div>
                    <p className="min-h-[40px] text-muted-foreground">{message}</p>
                </div>

                <div className={cn("grid gap-4", rechargeStatus !== 'idle' && 'opacity-0')}>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="recharge-code" className="text-right">
                            رمز الكرت
                        </Label>
                        <Input
                            id="recharge-code"
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            className="col-span-3"
                            value={rechargeCode}
                            onChange={(e) => setRechargeCode(e.target.value)}
                            disabled={rechargeStatus !== 'idle'}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full" onClick={handleRecharge} disabled={rechargeStatus !== 'idle'}>
                       {rechargeStatus === 'idle' ? <PlusCircle className="ml-2 h-4 w-4" /> : <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
                       {rechargeStatus === 'idle' ? 'شحن' : 'جاري الشحن...'}
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="my-6 grid grid-cols-2 gap-4">
             <Card className="overflow-hidden rounded-xl">
                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                    <CreditCard className="mb-2 h-8 w-8 text-primary" />
                    <p className="text-sm font-semibold">طرق الدفع</p>
                </CardContent>
             </Card>
             <Card className="overflow-hidden rounded-xl">
                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                    <Gift className="mb-2 h-8 w-8 text-primary" />
                    <p className="text-sm font-semibold">إرسال هدية</p>
                </CardContent>
             </Card>
          </div>

          <Card className="overflow-hidden rounded-xl">
            <CardHeader>
              <CardTitle>سجل المعاملات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                {transactions.map((transaction, index) => (
                  <div key={transaction.id}>
                    <div className="flex items-center justify-between px-6 py-4">
                        <div>
                            <p className="font-semibold">{transaction.type}</p>
                            <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                        <p className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-destructive'}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} دينار ليبي
                        </p>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="fixed bottom-0 z-40 w-full border-t bg-background">
          <nav className="flex items-center justify-around p-2">
            <a
              href="/shop"
              className="flex flex-col items-center text-xs text-muted-foreground"
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
              className="flex flex-col items-center text-xs font-medium text-primary"
            >
              <WalletIcon className="mb-1 h-6 w-6" />
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
