import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Lightbulb,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { appsData } from "@/lib/apps-data";

const chartData = appsData
  .slice(0, 5)
  .map((app) => ({
    name: app.name,
    usage: app.usage.time,
  }))
  .sort((a, b) => b.usage - a.usage);

const chartConfig = {
  usage: {
    label: "Usage (min)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Welcome to Mobile Mate
        </h1>
        <p className="text-muted-foreground">
          Your personal assistant for managing and discovering mobile apps.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>App Usage Overview</CardTitle>
            <CardDescription>
              A quick look at your most used apps this week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                   <YAxis hide={true} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="usage" fill="var(--color-usage)" radius={8} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Privacy Status</CardTitle>
            <CardDescription>
              Keep your data safe by analyzing app permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
             <Shield className="size-16 text-accent" />
             <p className="font-semibold text-lg">All Apps Secure</p>
             <p className="text-muted-foreground text-sm">You haven't scanned any apps yet. Start now to ensure your privacy.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
                <Link href="/permissions">Analyze Permissions <ArrowRight/></Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
           <CardHeader>
            <CardTitle>App Recommendations</CardTitle>
            <CardDescription>
              Discover new apps tailored to your preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
             <Lightbulb className="size-16 text-primary" />
             <p className="font-semibold text-lg">Find Your Next Favorite App</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
                <Link href="/recommendations">Get Suggestions <ArrowRight/></Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
