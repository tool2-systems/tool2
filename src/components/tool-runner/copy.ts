export const copy = {
  fileTooLarge: (mb: number) => `FILE EXCEEDS ${mb} MB.`,
  uploadTitle: "UPLOAD CSV FILE",
  uploadHint: "DROP FILE HERE OR CLICK TO SELECT",
  analyzing: "ANALYZING…",
  preparing: "PREPARING…",
  startOver: "START OVER",
  changeFile: "Change file",
  generatePreview: "GENERATE PREVIEW",
  payAndDownload: (usd: number) => `PAY $${usd} AND DOWNLOAD`,
  runAgain: "Run again",
  previewFailed: "PREVIEW FAILED.",
  processingFailed: "PROCESSING FAILED.",
  paymentFailed: "PAYMENT FAILED.",
  availableUntil: (s: string) => `AVAILABLE UNTIL ${s}`
}
