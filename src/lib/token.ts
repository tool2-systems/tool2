export function createDemoToken(): string {
  return "demo-token-" + Math.random().toString(36).slice(2);
}

export function validateDemoToken(token: string | null): boolean {
  return !!token && token.startsWith("demo-token-");
}
