export type TempFile = {
  id: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
};

export function saveTempFile() {
  throw new Error("Not implemented");
}

export function deleteTempFile() {
  throw new Error("Not implemented");
}
