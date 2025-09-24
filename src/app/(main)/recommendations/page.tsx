"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Wand2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getRecommendations } from "./actions";

const recommendationSchema = z.object({
  userPreferences: z
    .string()
    .min(10, "Please describe your preferences in a bit more detail."),
  currentAppUsage: z
    .string()
    .min(10, "Please describe your current app usage in a bit more detail."),
});

type RecommendationFormValues = z.infer<typeof recommendationSchema>;

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RecommendationFormValues>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      userPreferences: "",
      currentAppUsage: "",
    },
  });

  const onSubmit = async (values: RecommendationFormValues) => {
    setLoading(true);
    setRecommendations([]);
    setError(null);
    try {
      const result = await getRecommendations(values);
      if (result.recommendedApps) {
        setRecommendations(result.recommendedApps);
      }
    } catch (e) {
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          App Recommendations
        </h1>
        <p className="text-muted-foreground">
          Discover new apps based on your interests and usage.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tell Us About Yourself</CardTitle>
            <CardDescription>
              The more details you provide, the better the recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="userPreferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Interests & Preferences</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., I enjoy photography, casual gaming, and reading science fiction. I prefer apps with a clean, minimalist design."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentAppUsage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apps You Currently Use & Like</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., I use Instagram for photo sharing, Duolingo for learning Spanish, and Pocket for saving articles."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Wand2 />
                  )}
                  <span>Get Recommendations</span>
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Suggestions</CardTitle>
            <CardDescription>
              Here are some apps you might like.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-destructive">{error}</div>
            ) : recommendations.length > 0 ? (
              <ul className="space-y-2">
                {recommendations.map((app, index) => (
                  <li
                    key={index}
                    className="p-3 rounded-md bg-secondary text-secondary-foreground"
                  >
                    {app}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground h-64 flex flex-col items-center justify-center">
                <Wand2 className="size-12 mb-4" />
                <p>Your recommendations will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
