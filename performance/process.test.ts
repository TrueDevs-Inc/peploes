import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { runCommand } from "./process";

const sink = vi.hoisted(() => ({ fail: false }));
vi.mock("node:fs", async (importOriginal) => {
  const fs = await importOriginal<typeof import("node:fs")>();
  return {
    ...fs,
    createWriteStream: (...args: Parameters<typeof fs.createWriteStream>) =>
      sink.fail
        ? fs.createWriteStream("/dev/full", { flags: "w" })
        : fs.createWriteStream(...args),
  };
});

function killCollector(pid: number): void {
  if (!Number.isInteger(pid) || pid <= 0) return;
  try {
    process.kill(pid, "SIGKILL");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH")
      return;
    throw error;
  }
}

describe("audit process lifecycle", () => {
  it("waits for collector termination before rejecting a full-disk log failure", async () => {
    const dir = await mkdtemp(join(tmpdir(), "perf-log-failure-"));
    const failures: unknown[] = [];
    let pid = 0;
    const server = createServer((socket) => {
      socket.once("data", (data) => {
        pid = Number(data.toString());
        socket.end("ready");
      });
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    sink.fail = true;
    try {
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("Missing test server address");
      const script = `process.on("SIGTERM",()=>{});const socket=require("node:net").connect(${address.port},"127.0.0.1");socket.on("connect",()=>socket.write(String(process.pid)));socket.once("data",()=>process.stdout.write("disk-full"));setInterval(()=>{},1000)`;
      await expect(
        runCommand([process.execPath, "-e", script], {
          cwd: dir,
          log: join(dir, "collector.txt"),
          env: process.env,
          signal: new AbortController().signal,
          timeoutMs: 10000,
        }),
      ).rejects.toMatchObject({ code: "ENOSPC" });
      expect(pid).toBeGreaterThan(0);
      expect(() => process.kill(pid, 0)).toThrow();
    } catch (error) {
      failures.push(error);
    } finally {
      sink.fail = false;
      try {
        killCollector(pid);
      } catch (error) {
        failures.push(error);
      }
      await new Promise<void>((done) => server.close(() => done()));
      await rm(dir, { recursive: true });
    }
    if (failures.length)
      throw new AggregateError(failures, "Collector or cleanup failed");
  }, 15000);

  it("preserves collector failure and its diagnostics", async () => {
    const dir = await mkdtemp(join(tmpdir(), "perf-process-"));
    try {
      const log = join(dir, "collector.txt");
      const code = await runCommand(
        [
          process.execPath,
          "-e",
          'process.stderr.write("collector failed");process.exitCode=7',
        ],
        {
          cwd: dir,
          log,
          env: process.env,
          signal: new AbortController().signal,
          timeoutMs: 10000,
        },
      );
      expect({ code, log: await readFile(log, "utf8") }).toEqual({
        code: 7,
        log: "collector failed",
      });
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it("aborts an active collector and waits for its process to exit", async () => {
    const dir = await mkdtemp(join(tmpdir(), "perf-cancel-"));
    const controller = new AbortController();
    let pid = 0;
    const server = createServer((socket) => {
      socket.on("data", (data) => {
        pid = Number(data.toString());
        controller.abort();
      });
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    try {
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("Missing test server address");
      const script = `require("node:net").connect(${address.port},"127.0.0.1").end(String(process.pid));setInterval(()=>{},1000)`;
      const result = runCommand([process.execPath, "-e", script], {
        cwd: dir,
        log: join(dir, "collector.txt"),
        env: process.env,
        signal: controller.signal,
        timeoutMs: 10000,
      });
      await expect(result).rejects.toThrow(/aborted or timed out/);
      expect(pid).toBeGreaterThan(0);
      expect(() => process.kill(pid, 0)).toThrow();
    } finally {
      await new Promise<void>((done) => server.close(() => done()));
      await rm(dir, { recursive: true });
    }
  });
});
