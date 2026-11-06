import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

try {
  const { values } = parseArgs({
    options: {
      slug: { type: "string" },
      "description-file": { type: "string" },
    },
    allowPositionals: false,
  });
  if (
    !values.slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug) ||
    !values["description-file"]
  ) {
    throw new Error(
      "Usage: bun run adr --slug short-name --description-file /path/to/decision.md",
    );
  }
  const description = readFileSync(values["description-file"], "utf8").trim();
  if (!description)
    throw new Error(
      "Provide the human's decision description before creating an ADR.",
    );
  const directory = resolve("docs/adr");
  mkdirSync(directory, { recursive: true });
  const numbers = readdirSync(directory).map((name) =>
    Number(/^ADR-(\d+)-/.exec(name)?.[1] ?? 0),
  );
  const number = String(Math.max(0, ...numbers) + 1).padStart(3, "0");
  const name = `ADR-${number}-${values.slug}`;
  const file = resolve(directory, `${name}.md`);
  writeFileSync(file, `# ${name}\n\n${description}\n`, { flag: "wx" });
  process.stdout.write(`${file}\n`);
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
