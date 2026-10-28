import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import {
  findQueriesInPath,
  runTypegenGenerate,
  runTypegenWatcher,
} from "@sanity/codegen";
import { afterEach, beforeEach, expect, test } from "vitest";

let directory: string;
let watcher: ReturnType<typeof runTypegenWatcher> | undefined;

async function query(file: string, name: string, value: string) {
  const filename = join(directory, file);
  await mkdir(join(filename, ".."), { recursive: true });
  await writeFile(filename, `export const ${name} = groq\`"${value}"\`;`);
}

function options() {
  return {
    workDir: directory,
    config: {
      path: [
        join(directory, "queries/**/*.{ts,tsx}"),
        `!${join(directory, "queries/**/*.skip.ts")}`,
      ],
      schema: "schema.json",
      generates: "generated.ts",
    },
  };
}

function output() {
  return readFile(join(directory, "generated.ts"), "utf8");
}

beforeEach(async () => {
  // Resolve Windows short aliases so glob paths and the checkout share a canonical root.
  directory = await realpath(await mkdtemp(join(tmpdir(), "peploes-codegen-")));
  await mkdir(join(directory, "queries"));
  await writeFile(join(directory, "schema.json"), "[]");
});

afterEach(async () => {
  await watcher?.stop();
  watcher = undefined;
  await rm(directory, { recursive: true, force: true });
});

test("discovers query globs, excludes dependencies, and preserves generated types", async () => {
  await query("queries/menu.ts", "MENU_QUERY", "menu");
  await query("queries/nested/seasonal.tsx", "SEASONAL_QUERY", "seasonal");
  await query("queries/ignored.skip.ts", "IGNORED_QUERY", "skip");
  await query(
    "queries/node_modules/dependency/index.ts",
    "DEPENDENCY_QUERY",
    "dependency",
  );
  const result = await runTypegenGenerate(options());
  expect(result.filesWithErrors).toBe(0);
  expect(result.queriesCount).toBe(2);
  const generated = await output();
  expect(generated).toContain('export type MENU_QUERY_RESULT = "menu"');
  expect(generated).toContain('export type SEASONAL_QUERY_RESULT = "seasonal"');
  expect(generated).not.toContain("IGNORED_QUERY_RESULT");
  expect(generated).not.toContain("DEPENDENCY_QUERY_RESULT");
}, 30000);

test("regenerates on query add, change, unlink and schema changes while ignoring unrelated files", async () => {
  await query("queries/menu.ts", "MENU_QUERY", "before");
  watcher = runTypegenWatcher(options());
  await new Promise<void>((resolve, reject) => {
    watcher?.watcher.once("ready", resolve);
    watcher?.watcher.once("error", reject);
  });
  await expect
    .poll(output, { timeout: 30000 })
    .toContain('MENU_QUERY_RESULT = "before"');

  await query("queries/menu.ts", "MENU_QUERY", "after");
  await expect
    .poll(output, { timeout: 30000 })
    .toContain('MENU_QUERY_RESULT = "after"');

  await query("queries/new/seasonal.tsx", "SEASONAL_QUERY", "seasonal");
  await expect
    .poll(output, { timeout: 30000 })
    .toContain("SEASONAL_QUERY_RESULT");
  await rm(join(directory, "queries/new/seasonal.tsx"));
  await expect
    .poll(output, { timeout: 30000 })
    .not.toContain("SEASONAL_QUERY_RESULT");

  await writeFile(
    join(directory, "schema.json"),
    JSON.stringify([
      { name: "MenuTitle", type: "type", value: { type: "string" } },
    ]),
  );
  await expect
    .poll(output, { timeout: 30000 })
    .toContain("export type MenuTitle = string");
  await expect
    .poll(() => watcher?.getStats().generationSuccessfulCount)
    .toBe(5);
  await query(
    "queries/node_modules/dependency/index.ts",
    "DEPENDENCY_QUERY",
    "dependency",
  );
  await query("queries/ignored.skip.ts", "IGNORED_QUERY", "skip");
  await writeFile(join(directory, "queries/notes.md"), "Unrelated text");
  await delay(10000);
  expect(watcher.getStats().generationSuccessfulCount).toBe(5);
  expect(watcher.getStats().generationFailedCount).toBe(0);
}, 120000);

test.each(["queries", "queries/menu.ts", "queries/**/*.{ts,tsx}"])(
  "discovers queries from directory, literal and glob paths: %s",
  async (pattern) => {
    await query("queries/menu.ts", "MENU_QUERY", "menu");
    const discovery = findQueriesInPath({ path: join(directory, pattern) });
    const extracted = [];
    for await (const file of discovery.queries) {
      expect(file.errors).toEqual([]);
      extracted.push(...file.queries.map((item) => item.query));
    }
    expect(extracted).toEqual(['"menu"']);
  },
  30000,
);

test.each(["queries/", "future/"])(
  "watches a literal directory with a trailing slash, including one created later: %s",
  async (path) => {
    const config = { ...options().config, path: `${join(directory, path)}/` };
    watcher = runTypegenWatcher({ workDir: directory, config });
    await new Promise<void>((resolve, reject) => {
      watcher?.watcher.once("ready", resolve);
      watcher?.watcher.once("error", reject);
    });
    await expect
      .poll(() => watcher?.getStats().generationSuccessfulCount, {
        timeout: 30000,
      })
      .toBe(1);
    await query(`${path}menu.ts`, "MENU_QUERY", "added");
    await expect
      .poll(output, { timeout: 30000 })
      .toContain('MENU_QUERY_RESULT = "added"');
    await query(`${path}menu.ts`, "MENU_QUERY", "changed");
    await expect
      .poll(output, { timeout: 30000 })
      .toContain('MENU_QUERY_RESULT = "changed"');
    expect(watcher.getStats().generationFailedCount).toBe(0);
  },
  60000,
);
