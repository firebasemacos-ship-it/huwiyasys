import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { appsData, type App } from "@/lib/apps-data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PrivacyAnalysisDialog } from "./privacy-analysis-dialog";

type AppWithIcon = App & { iconUrl: string };

export default function PermissionsPage() {
  const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img.imageUrl]));
  const appsWithIcons: AppWithIcon[] = appsData.map(app => ({
    ...app,
    iconUrl: imageMap.get(app.iconImageId) || `https://picsum.photos/seed/${app.id}/64/64`,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Permission Manager
        </h1>
        <p className="text-muted-foreground">
          Review and analyze the permissions of your installed apps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Installed Apps</CardTitle>
          <CardDescription>Select an app to analyze its privacy risks.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appsWithIcons.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={app.iconUrl}
                        alt={`${app.name} icon`}
                        width={40}
                        height={40}
                        className="rounded-lg"
                        data-ai-hint="app icon"
                      />
                      <span className="font-medium">{app.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{app.category}</TableCell>
                  <TableCell className="text-right">
                    <PrivacyAnalysisDialog app={app} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
