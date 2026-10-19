import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const studio = path.resolve("studio");
const commands = JSON.parse(
  readFileSync(path.join(studio, "package.json"), "utf8"),
).scripts;
let fixture: string;

function run(args: string[], mode = "1", exitCode = "0") {
  return spawnSync(process.execPath, args, {
    cwd: fixture,
    encoding: "utf8",
    env: { ...process.env, PEPLOES_SEED_APPLY: mode, TEST_SEED_EXIT: exitCode },
  });
}

describe("Sanity seed command safeguards", () => {
  beforeEach(() => {
    fixture = mkdtempSync(path.join(tmpdir(), "peploes-seed-test-"));
    copyFileSync(path.join(studio, "seed.cjs"), path.join(fixture, "seed.cjs"));
    const sanity = path.join(fixture, "node_modules", "sanity");
    mkdirSync(path.join(sanity, "bin"), { recursive: true });
    writeFileSync(
      path.join(sanity, "package.json"),
      JSON.stringify({ name: "sanity" }),
    );
    writeFileSync(
      path.join(sanity, "bin", "sanity"),
      [
        "console.log(JSON.stringify({ args: process.argv.slice(2), mode: process.env.PEPLOES_SEED_APPLY }));",
        "process.exitCode = Number(process.env.TEST_SEED_EXIT);",
      ].join("\n"),
    );
  });

  afterEach(() => {
    rmSync(fixture, { recursive: true, force: true });
  });

  it.each([
    ["seed:preview", "seed-menus.ts", "0"],
    ["seed:development", "seed-menus.ts", "1"],
    ["seed:events:preview", "seed-seasonal.ts", "0"],
    ["seed:events:development", "seed-seasonal.ts", "1"],
  ])(
    "%s passes the correct script and overrides inherited write mode",
    (command, script, expected) => {
      const args = commands[command].split(" ");
      expect(args.shift()).toBe("node");
      const result = run(args, expected === "0" ? "1" : "0");
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        args: ["exec", script, "--with-user-token"],
        mode: expected,
      });
    },
  );

  it.each([
    ["other", "apply"],
    ["menus", "unknown"],
    ["events", "apply", "extra"],
  ])("rejects invalid arguments %j before starting Sanity", (...args) => {
    const result = run(["seed.cjs", ...args]);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Usage:");
  });

  it("propagates the CLI failure instead of reporting success", () => {
    expect(run(["seed.cjs", "menus", "preview"], "1", "7").status).toBe(7);
  });
});
