# IB0-WP03 Compiler Configuration and Package API Report

Commit under test: see `evidence/IB0-WP03/README.md`. Baseline: `de13629`. Toolchain: TypeScript 6.0.3, Angular compiler-cli 22.1.8.

## 1. Where the controls live

Both applications build from `apps/<app>/tsconfig.app.json`, which extends the root `tsconfig.json` and overrides only `types`. The controls are therefore set once, in the root file.

| Option | Section | Baseline (`de13629`) | Now | Effective in both apps |
| --- | --- | --- | --- | --- |
| `strict` | `compilerOptions` | not set (TypeScript 6.0 default: on) | `true` | `true` |
| `noImplicitAny` | `compilerOptions` | not set (on through `strict`) | `true` | `true` |
| `strictTemplates` | `angularCompilerOptions` | not set (compiler-cli: `strictTemplates !== false`) | `true` | `true` |
| `paths` | `compilerOptions` | not set | 18 exact aliases | 18 |

Unchanged baseline options (13): `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `skipLibCheck`, `isolatedModules`, `experimentalDecorators`, `importHelpers`, `target: ES2022`, `module: preserve`, `enableI18nLegacyMessageIdFormat: false`, `strictInjectionParameters: true`, `strictInputAccessModifiers: true`. `angular.json` is unchanged; both production builds use `@angular/build:application` with AOT (its default; no target sets `aot: false`).

Effective values are read by the verifier with `@angular/compiler-cli` `readConfiguration`, which resolves `extends` the same way the build does (check V03). A raw scan of every `tsconfig*.json` rejects any strict-family or template strict option set to `false` (V04).

## 2. Effect on the build

The explicit values equal the former defaults, so both production outputs are byte-identical to the `de13629` build (`logs/build-output-vs-baseline.log`, 12/12 files). The difference is that the controls are now stated, and a verifier fails if they are removed (`logs/negative-verifier-mutations.log`, M1–M5).

## 3. Negative proof

| Case | Mutation (scratch copy) | Result |
| --- | --- | --- |
| B1 | `export function wp03NegativeTs(value) { const s: string = null; return s + value; }` in `app.ts` | Build exit 1: TS7006 (implicit any), TS2322 (`null` to `string`) |
| B1c | B1 with `strict: false`, `noImplicitAny: false` | Build exit 0: the explicit flags are what reject B1 |
| B2 | `(click)="wp03Take($event)"` bound to `wp03Take(value: number)` | Build exit 1: TS2345 (`PointerEvent` not assignable to `number`), a `strictDomEventTypes` check that only `strictTemplates` enables |
| B2c | B2 with `strictTemplates: false` | Build exit 0: the explicit flag is what rejects B2 |

## 4. Package path aliases and public entry points

| Package | Alias target |
| --- | --- |
| `@proseit/paep-analytics` | `./packages/analytics/src/index.ts` |
| `@proseit/paep-components` | `./packages/components/src/index.ts` |
| `@proseit/paep-contracts` | `./packages/contracts/src/index.ts` |
| `@proseit/paep-domain-ai` | `./packages/domain-ai/src/index.ts` |
| `@proseit/paep-domain-commerce` | `./packages/domain-commerce/src/index.ts` |
| `@proseit/paep-domain-construction` | `./packages/domain-construction/src/index.ts` |
| `@proseit/paep-domain-fiscal` | `./packages/domain-fiscal/src/index.ts` |
| `@proseit/paep-domain-iot` | `./packages/domain-iot/src/index.ts` |
| `@proseit/paep-domain-maintenance` | `./packages/domain-maintenance/src/index.ts` |
| `@proseit/paep-domain-manufacturing` | `./packages/domain-manufacturing/src/index.ts` |
| `@proseit/paep-domain-quality` | `./packages/domain-quality/src/index.ts` |
| `@proseit/paep-enterprise` | `./packages/enterprise/src/index.ts` |
| `@proseit/paep-foundation` | `./packages/foundation/src/index.ts` |
| `@proseit/frappe-sdk` | `./packages/frappe-sdk/src/index.ts` |
| `@proseit/paep-i18n` | `./packages/i18n/src/index.ts` |
| `@proseit/paep-observability` | `./packages/observability/src/index.ts` |
| `@proseit/paep-offline` | `./packages/offline/src/index.ts` |
| `@proseit/paep-platform` | `./packages/platform/src/index.ts` |

Each entry point holds two comment lines and `export {};`. The package API check (V09) confirms: the content is a placeholder; each alias resolves through `ts.resolveModuleName` with the root options to its entry point; and a strict compile of all 18 entry points reports 0 diagnostics. V08 confirms there is no wildcard or sub-path alias, so no deep path is published. Stopping consumers from importing internal paths is deep-import enforcement, which IR-01 assigns to IB0-WP04.

`baseUrl` is not used: TypeScript 6.0 deprecates it, and `paths` resolve relative to the tsconfig. `tsconfig.base.json` is not created (IB0-WP04, see `definition-audit.md` §4(ii)).
