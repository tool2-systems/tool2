"use client";

import { FileToolRunner } from "@/components/tool-runtime/file-tool-runner";

export function CsvDedupeClient() {
  return (
    <FileToolRunner
      toolSlug="csv-dedupe"
      label="Upload CSV file"
      accept=".csv,text/csv"
      outputFileName="result.csv"
    />
  );
}
