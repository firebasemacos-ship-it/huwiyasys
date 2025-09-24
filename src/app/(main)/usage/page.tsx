"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appsData } from "@/lib/apps-data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const timeUsageData = appsData
  .map((app) => ({ name: app.name, time: app.usage.time }))
  .sort((a, b) => b.time - a.time);

const dataUsageData = appsData
  .map((app) => ({ name: app.name, data: app.usage.data }))
  .sort((a, b) => b.data - a.data);

const timeChartConfig = {
  time: {
    label: "Time (minutes)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const dataChartConfig = {
  data: {
    label: "Data (MB)",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export default function UsagePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          App Usage Analytics
        </h1>
        <p className="text-muted-foreground">
          Track app usage time and data consumption.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>
            Here's a breakdown of your app activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="time">
            <TabsList>
              <TabsTrigger value="time">Time Spent</TabsTrigger>
              <TabsTrigger value="data">Data Usage</TabsTrigger>
            </TabsList>
            <TabsContent value="time" className="pt-4">
              <ChartContainer
                config={timeChartConfig}
                className="h-96 w-full"
              >
                <ResponsiveContainer>
                  <BarChart data={timeUsageData} layout="vertical">
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      width={80}
                      className="text-xs"
                    />
                    <XAxis dataKey="time" type="number" hide />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar
                      dataKey="time"
                      fill="var(--color-time)"
                      radius={5}
                      layout="vertical"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="data" className="pt-4">
              <ChartContainer
                config={dataChartConfig}
                className="h-96 w-full"
              >
                <ResponsiveContainer>
                  <BarChart data={dataUsageData} layout="vertical">
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      width={80}
                      className="text-xs"
                    />
                    <XAxis dataKey="data" type="number" hide />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar
                      dataKey="data"
                      fill="var(--color-data)"
                      radius={5}
                      layout="vertical"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
