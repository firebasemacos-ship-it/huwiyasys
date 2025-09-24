"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import type { App } from "@/lib/apps-data";
import type { PrivacyRiskAnalysisOutput } from "@/ai/flows/privacy-risk-analysis";
import { getPrivacyAnalysis } from "./actions";

type PrivacyAnalysisDialogProps = {
  app: App;
};

export function PrivacyAnalysisDialog({ app }: PrivacyAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] =
    useState<PrivacyRiskAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await getPrivacyAnalysis({
        appName: app.name,
        appDescription: app.description,
        appPermissions: app.permissions,
      });
      setAnalysis(result);
    } catch (e) {
      setError("Failed to analyze privacy risks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      handleAnalyze();
    }
  };
  
  const getRiskBadgeVariant = (riskLevel: string | undefined) => {
    switch (riskLevel) {
        case 'low':
            return 'default';
        case 'medium':
            return 'secondary';
        case 'high':
            return 'destructive';
        default:
            return 'outline';
    }
  }

  const getRiskBadgeClasses = (riskLevel: string | undefined) => {
     switch (riskLevel) {
      case "low":
        return "bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30 dark:text-green-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30 dark:text-yellow-400";
      case "high":
        return "bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30 dark:text-red-400";
      default:
        return "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Analyze Privacy</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Privacy Analysis: {app.name}</DialogTitle>
          <DialogDescription>
            AI-powered insights into potential privacy risks.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing permissions...</p>
            </div>
          )}
          {error && <div className="text-destructive text-center">{error}</div>}
          {analysis && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Overall Risk Level</h3>
                <Badge variant="outline" className={`capitalize text-base ${getRiskBadgeClasses(analysis.riskLevel)}`}>
                  {analysis.riskLevel}
                </Badge>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              </div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="detailed-risks">
                  <AccordionTrigger>Detailed Risks</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      {analysis.detailedRisks.map((risk, i) => (
                        <li key={i} className="text-sm">{risk}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="recommendations">
                  <AccordionTrigger>Recommendations</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      {analysis.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
