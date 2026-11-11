---
title: FAQ
description: Short answers about routes, generated code, entry-point annotations, exported APIs, source suppressions, and resolving packages before analysis.
---

## Why are my Flutter routes or router pages reported as unused?

Hyena does not automatically treat Flutter or router pages as live. A router, dependency-injection system, or plugin registry can reach declarations without a Dart reference Hyena can follow, so declare those roots in `hyena.yaml`:

```yaml title="hyena.yaml"
hyena:
  dead_code:
    entry_points:
      - AppRoutes
      - ServiceRegistry.register
    entry_point_annotations:
      - RoutePage
```

`entry_points` takes exact declaration names, either simple (`AppRoutes`) or qualified by owner (`ServiceRegistry.register`). Matched declarations become reachability roots, so everything they reference stays live. A matched type container, such as a class, also keeps its public members.

Both lists are empty by default. Add only entry mechanisms a router, DI system, or similar tool actually uses. See [Framework and generated-code entry roots](/docs/configuration/#framework-and-generated-code-entry-roots) for the full matching rules.

## Do I need to exclude generated code?

No. Files ending in `.g.dart`, `.freezed.dart`, or `.mocks.dart`, including `part` files, are handled automatically:

- **Dead-code analysis** collects references from them, so declarations used only by generated code stay reachable, and never reports their own declarations.
- **Complexity analysis** skips them.

A stale or broken generated file does not abort the run.

Do not list those suffixes in `exclude` unless you want the files removed entirely. A matching `exclude` pattern removes a generated file from analysis, including its references. Paths with a `.dart_tool`, `build`, or `generated` directory segment are still always excluded. See [Generated files](/docs/configuration/#generated-files) and [dead-code generated files](/docs/analysis/dead-code/#generated-files).

## How does annotation matching work?

`entry_point_annotations` marks annotated declarations as roots. A leading `@` is optional, so `RoutePage` and `@RoutePage` are equivalent.

- A **simple** name matches the final component regardless of import prefix: `RoutePage` matches `@RoutePage()` and `@framework.RoutePage()`.
- A **qualified** name matches the exact prefix and name: `riverpod.Riverpod` matches `@riverpod.Riverpod()`, not `@framework.Riverpod()`.

Matching is lexical, against the annotation as written in source. Hyena does not resolve the annotation's type. See [Annotation matching](/docs/configuration/#annotation-matching).

## Why are public declarations in my package reported?

`ignore_exports` defaults to `false`, so unused public declarations are findings like any other. Public visibility alone does not make a declaration reachable.

If you publish a reusable package whose public API is consumed outside the repository, enable export preservation:

```yaml title="hyena.yaml"
hyena:
  dead_code:
    ignore_exports: true
```

Or pass `--ignore-exports` for a single run. Hyena then treats as roots the public declarations in directly importable `lib/` libraries (any file not under `lib/src/`) and their `part` files, plus public declarations exposed by explicit `export` directives, honoring `show` and `hide`. Public members of those exported types are preserved too. See [Export handling](/docs/analysis/dead-code/#export-handling).

## How do I suppress a single finding?

Put a `// hyena:ignore` comment immediately before the declaration:

```dart
// hyena:ignore dead-code
void registeredByName() {}

// hyena:ignore cyclomatic-complexity, max-nesting
void stateMachine() {}
```

The supported rules are `dead-code`, `complexity`, `cyclomatic-complexity`, `max-nesting`, and `max-parameters`. Separate multiple rules with commas. `complexity` covers all three complexity rules.

A declaration suppressed for `dead-code` remains a reachability root, so its dependencies do not become cascading findings. See [Baselines and source suppressions](/docs/cli-reference/#baselines-and-source-suppressions), [dead-code suppressions](/docs/analysis/dead-code/#suppress-an-intentional-finding), and [complexity suppressions](/docs/analysis/complexity/#suppress-an-intentional-violation).

## Do I need to run `dart pub get` first?

Yes. Dead-code analysis uses the official Dart analyzer and your package resolution, including `.dart_tool/package_config.json`. Run `dart pub get`, and code generation if you use it, before analysis:

```shell
dart pub get
dart run hyena_dart analyze .
```

A file that still fails to resolve, has analysis or syntax errors, or cannot be read is skipped with `Warning: skipped <path>: <reason>` on stderr. Skipped files do not fail the run, but skipping is not a substitute for resolving the package: a skipped file's declarations are not checked. See [Prepare the target](/docs/installation/#prepare-the-target) and [Skipped files](/docs/ci/#skipped-files).
