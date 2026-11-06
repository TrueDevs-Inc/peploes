import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export function redact(
  value: string,
  env: Readonly<Record<string, string | undefined>>,
): string {
  let result = value.replace(
    /((?:access_token|api_key|apikey|sentry_key|client_secret|token)=)[^&\s"'<>\\]+/gi,
    "$1[REDACTED]",
  );
  for (const [key, secret] of Object.entries(env)) {
    if (
      /SECRET|PASSWORD|TOKEN|KEY|DSN/.test(key) &&
      secret &&
      secret.length >= 8
    ) {
      result = result
        .split(secret)
        .join("[REDACTED]")
        .split(encodeURIComponent(secret))
        .join("[REDACTED]");
    }
  }
  return result;
}

export async function redactArtifacts(directory: string) {
  for (const file of await readdir(directory, { withFileTypes: true })) {
    if (!file.isFile() || !/\.(json|html|txt)$/.test(file.name)) continue;
    const path = join(directory, file.name);
    const raw = await readFile(path, "utf8");
    const clean = redact(raw, process.env);
    if (clean !== raw) await writeFile(path, clean);
  }
}
