import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolBySlug } from "@/lib/toolMatrix";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvDedupeClient } from "@/components/tool-runtime/csv-dedupe-client";

type PageProps = {
  params: Promise<{ tool: string }>;
};

function titleCaseCategory(input: string) {
  const s = input.trim();
  if (!s) return s;
  return s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase();
}

export default async function Page({ params }: PageProps) {
  const { tool: slug } = await params;

  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const categoryLabel = titleCaseCategory(tool.category);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/?category=${encodeURIComponent(tool.category)}`}>
                  {categoryLabel}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tool.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{tool.title}</h1>
          <p className="text-sm text-muted-foreground">{tool.problem_solved}</p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Run</CardTitle>
              <CardDescription>
                Upload a file, run the tool, and preview the result.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tool.tool_slug === "csv-dedupe" ? (
                <CsvDedupeClient />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Tool runtime not implemented yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">What this tool does</CardTitle>
              <CardDescription>
                A short, factual description of the output and behavior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-base">{tool.problem_solved}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">FAQ</CardTitle>
              <CardDescription>Basic handling and payment notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">How is my file handled?</div>
                <p className="text-sm text-muted-foreground">
                  Files are processed temporarily and deleted within a short period. Detailed handling will be documented.
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">How fast is processing?</div>
                <p className="text-sm text-muted-foreground">
                  Processing times vary by tool and file size. More details coming soon.
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Are payments secure?</div>
                <p className="text-sm text-muted-foreground">
                  Payments are handled through an external provider. Full integration is coming soon.
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Do you store my data?</div>
                <p className="text-sm text-muted-foreground">
                  No permanent storage is planned in the MVP. A detailed deletion policy will be added soon.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Related tools</CardTitle>
              <CardDescription>More tools in the same category.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No related tools yet.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
