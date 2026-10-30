interface Window {
  gtag?: (command: string, ...args: unknown[]) => void;
  clientErrorLog?: unknown[];
  dataLayer?: unknown[];
}
