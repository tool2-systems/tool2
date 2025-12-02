import { getToolBySlug, getAllTools } from "@/lib/toolMatrix";
import { notFound } from "next/navigation";
import { CsvDedupeClient } from "@/components/tool-runtime/csv-dedupe-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  params: Promise<{
    tool: string;
  }>;
};

export default async function Page(props: PageProps) {
  const { tool } = await props.params;
  const toolDef = getToolBySlug(tool);

  if (!toolDef) {
    notFound();
  }

  const categoryLabel = toolDef.category.toUpperCase();

  const inputLabel =
    toolDef.input_type === "pdf"
      ? "Upload PDF file"
      : toolDef.input_type === "csv"
      ? "Upload CSV file"
      : "Upload file";

  const accept =
    toolDef.input_type === "pdf"
      ? ".pdf"
      : toolDef.input_type === "csv"
      ? ".csv,.tsv,.txt"
      : undefined;

  const allTools = getAllTools();
  const related = allTools.filter(
    (t) => t.category === toolDef.category && t.tool_slug !== toolDef.tool_slug
  );

  return (
    <div className="space-y-12">
      <nav className="text-sm text-muted-foreground">
        <a href="/" className="hover:underline">
          Tools
        </a>
        {" / "}
        <span>{categoryLabel}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {toolDef.title}
        </h1>
        <p className="text-base text-muted-foreground">
          {toolDef.problem_solved}
        </p>
      </header>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {inputLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {toolDef.tool_slug === "csv-dedupe" ? (
              <CsvDedupeClient />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" accept={accept} />
                <Button disabled>Run (not implemented)</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Preview is locked. Processing not implemented.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Button disabled className="w-full">
          Unlock full download — $2
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What this tool does</h2>
        <p className="text-base text-muted-foreground">
          {toolDef.problem_solved}
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">FAQ</h2>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">How is my file handled?</h3>
          <p className="text-base text-muted-foreground">
            Files are processed temporarily and deleted within a short period.
            Detailed handling will be documented.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">How fast is processing?</h3>
          <p className="text-base text-muted-foreground">
            Processing times vary by tool and file size. More details coming soon.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Are payments secure?</h3>
          <p className="text-base text-muted-foreground">
            Payments are handled through an external provider. Full integration
            is coming soon.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Do you store my data?</h3>
          <p className="text-base text-muted-foreground">
            No permanent storage is planned in the MVP. A detailed deletion
            policy will be added soon.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Related tools</h2>
        {related.length === 0 ? (
          <p className="text-sm text-muted-foreground">No related tools yet.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {related.map((rt) => (
              <li key={rt.tool_slug}>
                <a
                  href={`/${rt.tool_slug}`}
                  className="text-base hover:underline"
                >
                  {rt.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
