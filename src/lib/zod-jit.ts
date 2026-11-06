const ZOD_CONFIG_GLOBAL = "__zod_globalConfig";

type TZodGlobalScope = Partial<
  Record<typeof ZOD_CONFIG_GLOBAL, { jitless?: boolean }>
>;

export function disableZodJit(): void {
  const scope = globalThis as TZodGlobalScope;
  scope[ZOD_CONFIG_GLOBAL] ??= {};
  scope[ZOD_CONFIG_GLOBAL].jitless = true;
}
