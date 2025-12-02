"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ToolPreviewProps = {
  locked?: boolean;
  previewText?: string | null;
};

export function ToolPreview({ locked = true, previewText }: ToolPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {locked ? (
          <p className="text-sm text-muted-foreground">
            Preview is locked. This tool does not expose a sample yet.
          </p>
        ) : previewText ? (
          <div className="space-y-2">
            <pre className="p-3 border rounded bg-muted text-sm whitespace-pre-wrap">
              {previewText}
            </pre>
            <p className="text-xs text-muted-foreground">
              This is a sample of the processed result. The full file is not available for download yet.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No preview available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
