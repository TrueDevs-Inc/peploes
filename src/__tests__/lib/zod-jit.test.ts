import { describe, expect, it } from "vitest";
import { config } from "zod";

import { disableZodJit } from "@/lib/zod-jit";

describe("Zod JIT switch", function zodJitTests() {
  it("reaches the configuration Zod reads", function sharedConfigTest() {
    disableZodJit();

    expect(config().jitless).toBe(true);
  });
});
