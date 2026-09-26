# IB1-CONTRACTS-CONFIG — Bootstrap Sequence

Reference app: `apps/reference-app/src/main.ts`. Gate: `packages/platform/src/lib/runtime-config/startup.ts`.

```
index.html  <base href="/">                (set at deploy time for a sub-path, e.g. /erp/)
main.ts
  startWithRuntimeConfig({ load, onReady, onFailure })        once per page (second call: CFG_STARTUP_REPEATED)
    load = loadRuntimeConfig(REFERENCE_APP_RUNTIME_CONTEXT, {
             fetch, configUrl: new URL('config/runtime-config.json', document.baseURI),
             documentBasePath: baseURI.pathname })
      fetch  mode same-origin, credentials same-origin, cache no-store, redirect error
      reject redirect / non-200 / non-JSON content type / declared or actual size > 64 KiB
      validateRuntimeConfigBytes: decode -> parse -> version -> content -> schema -> semantic -> compatibility
    outcome not an object, ok:true with a store the validator did not produce, or any exception -> CFG_INTERNAL
    ok:true  -> onReady(deep-frozen store)
                 data-paep-profile = profile
                 bootstrapApplication(App, providers + RUNTIME_CONFIG_STORE)
                 data-paep-config = "ready" (only after bootstrap resolves)
                 onReady rejects -> fail-safe state (startup / CFG_INTERNAL)
    ok:false -> onFailure(failure)
                 <main id="paep-config-failure" role="alert"> fixed title, fixed text, <code>diagnosticId</code> (textContent only)
                 data-paep-config = "failed"; Angular is never started
```

| Forbidden behaviour | How it is prevented | Test |
| --- | --- | --- |
| Partial startup | `bootstrapApplication` is only reachable from `onReady`, which only receives a validator-produced store | S-fail-open tests; portability F1–F9 (`<app-root>` never rendered) |
| Silent defaults | No default configuration exists in code; missing fields fail the closed schema | schema negatives |
| Localhost fallback | No fallback URL; 404 or HTML fallback fails (`CFG_LOAD_STATUS`, `CFG_LOAD_CONTENT_TYPE`) | loader tests; portability F7, F8 |
| Mutable or emergency configuration | Store and config deep-frozen; once-only latch; forged frozen outcomes refused (WeakSet of validator stores) | freeze, latch and forged-outcome tests; mutations M27–M31 |
| Disabled security | Production requires `security.cspProfile: "strict"`; https only; secrets rejected | semantic and content negatives; portability F5, F6, F9 |
