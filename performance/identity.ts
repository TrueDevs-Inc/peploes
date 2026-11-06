import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export const root = resolve(import.meta.dirname, "..");
export const sha256 = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export const writeJson = (path: string, value: unknown) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });

export async function sourceIdentity() {
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const paths = execFileSync(
    "git",
    ["ls-files", "-co", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .sort();
  const hash = createHash("sha256");
  for (const path of new Set(paths))
    hash
      .update(path)
      .update("\0")
      .update(sha256(await readFile(join(root, path))));
  return {
    head,
    sourceDigest: hash.digest("hex"),
    diffDigest: sha256(
      execFileSync("git", ["diff", "--binary", "HEAD"], {
        cwd: root,
        maxBuffer: 20 * 1024 * 1024,
      }),
    ),
  };
}
