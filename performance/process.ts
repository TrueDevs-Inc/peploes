import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { PerformanceError } from "./manifest";

export function runCommand(
  args: readonly string[],
  options: {
    readonly cwd: string;
    readonly log: string;
    readonly env: NodeJS.ProcessEnv;
    readonly signal: AbortSignal;
    readonly timeoutMs: number;
  },
): Promise<number> {
  return new Promise((resolve, reject) => {
    const [command, ...argv] = args;
    if (!command) return reject(new PerformanceError("Missing executable."));
    options.signal.throwIfAborted();
    const output = createWriteStream(options.log, { flags: "wx" });
    const child = spawn(command, argv, {
      cwd: options.cwd,
      env: options.env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.pipe(output, { end: false });
    child.stderr.pipe(output, { end: false });
    let stopped = false;
    let logError: Error | undefined;
    let escalation: ReturnType<typeof setTimeout> | undefined;
    const killGroup = (signal: NodeJS.Signals) => {
      if (!child.pid) return;
      try {
        process.kill(-child.pid, signal);
      } catch (error) {
        if (
          !(error instanceof Error && "code" in error && error.code === "ESRCH")
        )
          reject(error);
      }
    };
    const stop = () => {
      if (stopped) return;
      stopped = true;
      killGroup("SIGTERM");
      escalation = setTimeout(() => {
        killGroup("SIGKILL");
      }, 3000);
    };
    const timer = setTimeout(stop, options.timeoutMs);
    options.signal.addEventListener("abort", stop, { once: true });
    const cleanup = () => {
      clearTimeout(timer);
      clearTimeout(escalation);
      options.signal.removeEventListener("abort", stop);
    };
    output.on("error", (error) => {
      logError = error;
      stop();
    });
    child.on("error", (error) => {
      cleanup();
      output.end();
      reject(error);
    });
    child.on("close", (code) => {
      const finish = () => {
        cleanup();
        if (logError) return reject(logError);
        if (stopped)
          return reject(
            new PerformanceError(
              "Audit command aborted or timed out; population is invalid.",
            ),
          );
        resolve(code ?? 1);
      };
      if (output.destroyed) finish();
      else output.end(finish);
    });
  });
}
