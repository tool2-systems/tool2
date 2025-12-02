import { getAllTools } from "@/lib/toolMatrix";

export default function Page() {
  const tools = getAllTools();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Debug Tools</h1>
      <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded">
        {JSON.stringify(tools, null, 2)}
      </pre>
    </div>
  );
}
