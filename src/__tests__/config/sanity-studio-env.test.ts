import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";

let fixture: string;

beforeEach(() => {
  fixture = mkdtempSync(path.join(tmpdir(), "peploes-studio-env-"));
  mkdirSync(path.join(fixture, "studio"));
  for (const file of ["sanity.cli.ts", "load-env.ts", "project.ts"]) {
    copyFileSync(
      path.resolve("studio", file),
      path.join(fixture, "studio", file),
    );
  }
  symlinkSync(
    path.resolve("studio/node_modules"),
    path.join(fixture, "studio/node_modules"),
    "dir",
  );
  writeFileSync(
    path.join(fixture, ".env"),
    "SANITY_PROJECT_ID=websiteproject\nSANITY_DATASET=website\n",
  );
});

afterEach(() => {
  rmSync(fixture, { recursive: true, force: true });
});

it.each([
  {
    name: "website settings when there are no Studio overrides",
    files: {},
    command: "dev",
    environment: {},
    expected: { projectId: "websiteproject", dataset: "website" },
  },
  {
    name: "Studio .env overrides ahead of root website settings",
    files: {
      ".env":
        "SANITY_STUDIO_PROJECT_ID=studioproject\nSANITY_STUDIO_DATASET=studio\n",
    },
    command: "dev",
    environment: {},
    expected: { projectId: "studioproject", dataset: "studio" },
  },
  {
    name: "production Studio overrides ahead of base Studio and root settings",
    files: {
      ".env":
        "SANITY_STUDIO_PROJECT_ID=studioproject\nSANITY_STUDIO_DATASET=studio\n",
      ".env.production":
        "SANITY_STUDIO_PROJECT_ID=productionproject\nSANITY_STUDIO_DATASET=production\n",
    },
    command: "dev",
    environment: { SANITY_ACTIVE_ENV: "production" },
    expected: { projectId: "productionproject", dataset: "production" },
  },
  {
    name: "production Studio files for the build command",
    files: {
      ".env.production":
        "SANITY_STUDIO_PROJECT_ID=buildproject\nSANITY_STUDIO_DATASET=build\n",
    },
    command: "build",
    environment: {},
    expected: { projectId: "buildproject", dataset: "build" },
  },
  {
    name: "shell Studio settings ahead of Studio files",
    files: {
      ".env":
        "SANITY_STUDIO_PROJECT_ID=studioproject\nSANITY_STUDIO_DATASET=studio\n",
    },
    command: "dev",
    environment: {
      SANITY_STUDIO_PROJECT_ID: "shellproject",
      SANITY_STUDIO_DATASET: "shell",
    },
    expected: { projectId: "shellproject", dataset: "shell" },
  },
])("resolves $name", ({ files, command, environment, expected }) => {
  for (const [file, contents] of Object.entries(files)) {
    writeFileSync(path.join(fixture, "studio", file), contents);
  }
  const result = spawnSync(
    "bun",
    [
      "--no-env-file",
      "-e",
      'const {default: cli} = await import("./studio/sanity.cli.ts"); const {projectId, dataset} = await import("./studio/project.ts"); console.log(JSON.stringify({cli:cli.api,studio:{projectId,dataset}}));',
      "sanity",
      command,
    ],
    {
      cwd: fixture,
      encoding: "utf8",
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "development",
        ...environment,
      },
    },
  );
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({
    cli: expected,
    studio: expected,
  });
});
