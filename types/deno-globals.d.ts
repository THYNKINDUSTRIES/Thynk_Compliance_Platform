declare const Deno: any;
declare const Request: any;
declare const Response: any;
declare const fetch: any;

// Quick helpers to quiet editor-only diagnostics for Deno-based edge functions
declare namespace Deno {
  const env: { get(key: string): string | undefined };
}
