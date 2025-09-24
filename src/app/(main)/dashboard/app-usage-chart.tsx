"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import type { App } from "@/lib/apps-data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const chartConfig = {
  usage: {
    label: "Usage (min)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

type AppUsageChartProps = {
  apps: App[];
};

export function AppUsageChart({ apps }: AppUsageChartProps) {
  const chartData = apps
    .slice(0, 5)
    .map((app) => ({
      name: app.name,
      usage: app.usage.time,
    }))
    .sort((a, b) => b.usage - a.usage);

  return (
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
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: -10, bottom: 0 }}
            >
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
  );
}
