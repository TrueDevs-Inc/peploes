const { spawnSync } = require("node:child_process");
const { dirname, join } = require("node:path");

const [target, mode, ...extra] = process.argv.slice(2);
const scripts = { menus: "seed-menus.ts", events: "seed-seasonal.ts" };

if (
  !Object.hasOwn(scripts, target) ||
  !["preview", "apply"].includes(mode) ||
  extra.length > 0
) {
  process.stderr.write("Usage: node seed.cjs <menus|events> <preview|apply>\n");
  process.exitCode = 1;
} else {
  const cli = join(
    dirname(require.resolve("sanity/package.json")),
    "bin",
    "sanity",
  );
  const result = spawnSync(
    process.execPath,
    [cli, "exec", scripts[target], "--with-user-token"],
    {
      cwd: __dirname,
      stdio: "inherit",
      // Set the child environment directly; Bun inline assignments can retain inherited values on Windows.
      env: Object.fromEntries([
        ...Object.entries(process.env),
        ["PEPLOES_SEED_APPLY", mode === "apply" ? "1" : "0"],
      ]),
    },
  );
  if (result.error)
    process.stderr.write("Unable to start the Sanity seed command.\n");
  process.exitCode = result.status ?? 1;
}
