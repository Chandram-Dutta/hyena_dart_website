---
title: Configuration
description: Configure file exclusions, dead-code roots, and complexity thresholds in YAML.
---

Hyena reads configuration from either a dedicated `hyena.yaml` file or a `hyena:` section in `analysis_options.yaml`.

## Complete schema

```yaml title="hyena.yaml"
hyena:
  exclude:
    - "**/*.g.dart"
    - "**/fixtures/**"

  complexity:
    cyclomatic_threshold: 20
    max_nesting: 5
    max_parameters: 6

  dead_code:
    ignore_main: true
    ignore_exports: true
    ignore_private: false
    entry_points: []
    entry_point_annotations: []
```

All fields are optional. Missing sections and values use defaults.

## Fields and defaults

| YAML path | Type | Default | Meaning |
| --- | --- | --- | --- |
| `hyena.exclude` | list of strings | `[]` | Glob patterns matched against both the process-relative and full file path. |
| `hyena.complexity.cyclomatic_threshold` | non-negative integer | `20` | Flag functions with greater cyclomatic complexity. |
| `hyena.complexity.max_nesting` | non-negative integer | `5` | Flag functions with a greater maximum nesting level. |
| `hyena.complexity.max_parameters` | non-negative integer | `6` | Flag functions with a greater formal parameter count. |
| `hyena.dead_code.ignore_main` | boolean | `true` | Do not record `main` as a dead-code candidate. `main` is still a reachability root. |
| `hyena.dead_code.ignore_exports` | boolean | `true` | Keep directly exported API out of dead-code findings and use it as a reachability root. |
| `hyena.dead_code.ignore_private` | boolean | `false` | Keep private declarations out of findings and use them as reachability roots. |
| `hyena.dead_code.entry_points` | list of non-empty strings | `[]` | Declaration names retained as reachability roots. |
| `hyena.dead_code.entry_point_annotations` | list of non-empty strings | `[]` | Annotations whose declarations are retained as roots. |

Threshold comparisons are strict: **metric > threshold**. Equality is not a violation.

## Framework and generated-code entry roots

:::note[Available in v1.2.0]
`entry_points` and `entry_point_annotations` are included in Hyena Dart 1.2.0 and later.
:::

Frameworks and generators can reach declarations through metadata, registries, or generated glue that is not visible in the scanned reference graph. Declare those runtime roots instead of excluding a broad directory:

```yaml title="hyena.yaml"
hyena:
  dead_code:
    entry_points:
      - AppRoutes
      - ServiceRegistry.register
      - generatedCallbacks

    entry_point_annotations:
      - RoutePage
      - injectable
      - riverpod.Riverpod
```

Both lists are empty by default, so existing projects keep their prior reachability behavior until they opt in.

### Declaration matching

`entry_points` uses exact declaration names:

| Configuration | Matches | Does not match |
| --- | --- | --- |
| `register` | Any declaration whose simple name is exactly `register` | `registerAll` |
| `ServiceRegistry.register` | The `register` member owned by `ServiceRegistry` | `OtherRegistry.register` |
| `AppRoutes` | The `AppRoutes` type declaration | A different type or member |

Use a qualified owner and member when a common simple name would preserve too much code. The matcher does not use substring or pattern matching.

### Annotation matching

A leading `@` is optional in `entry_point_annotations`; `@injectable` and `injectable` are equivalent configuration values.

- A **simple** annotation name matches the final lexical component regardless of import prefix. `RoutePage` matches both `@RoutePage()` and `@framework.RoutePage()`.
- A **qualified** annotation name matches the exact lexical prefix and name. `riverpod.Riverpod` matches `@riverpod.Riverpod()`, but not `@framework.Riverpod()`.

This is lexical matching of the annotation as written in source, not package or type resolution across alternate prefixes.

### Reachability effect

A matched declaration becomes a dead-code graph root. Its outgoing calls and references are traversed, so dependencies used by a registered route, service, callback, or provider remain reachable too.

When the matched declaration is a type container—such as a class, mixin, extension, extension type, or enum—Hyena also preserves its public members. Private or unrelated members that are not reached from the root remain eligible for findings.

The feature applies to supported declarations including types, functions, methods, constructors, top-level variables, fields, typedefs, and annotated enum values. Configure only entry mechanisms you have reviewed; a broad simple name can intentionally retain declarations in multiple containers.

## Discovery

Without `--config`, Hyena:

1. resolves the target to an absolute path;
2. starts in that directory (or the parent if the target is a file);
3. checks `hyena.yaml`, then `analysis_options.yaml`;
4. walks upward until a file is found or the filesystem root is reached.

Because `hyena.yaml` is checked first in each directory, it wins over an `analysis_options.yaml` beside it.

:::note[Workspace configuration in v1.2.0]
When the target root declares a Dart workspace, Hyena discovers the nearest configuration separately for every package and never walks above the workspace root. An explicit `--config` bypasses discovery and applies one file to all packages. See [Workspaces and monorepos](/docs/workspaces/#configuration-per-package).
:::

Pass an explicit file to skip discovery:

```shell
hyena_dart analyze lib --config=tool/hyena-strict.yaml
```

The YAML must contain a top-level `hyena:` mapping. A valid file without that key produces the default configuration.

## Use `analysis_options.yaml`

Add `hyena:` beside existing analyzer and linter settings:

```yaml title="analysis_options.yaml"
include: package:lints/recommended.yaml

linter:
  rules:
    - prefer_const_constructors

hyena:
  exclude:
    - "**/*.gen.dart"
  complexity:
    cyclomatic_threshold: 15
```

Hyena reads only its own key. Dart analyzer settings continue to work normally.

## Exclusion behavior

Both analyzers recursively discover `*.dart` files and apply the same exclusions.

Custom patterns are checked first. Hyena then always excludes:

- file names ending in `.g.dart`;
- file names ending in `.freezed.dart`;
- file names ending in `.mocks.dart`;
- any path with a segment exactly named `generated`.

:::caution
Built-in exclusions cannot currently be disabled through configuration. If generated code participates in a reference chain, remember that it is outside the analysis graph.
:::

Pattern matching uses the Dart `glob` package. Quote patterns in YAML so characters such as `*` are treated as string content.

## Validation

Hyena rejects:

- a non-list `exclude` value;
- non-string entries in `exclude`;
- a non-list `entry_points` or `entry_point_annotations` value;
- non-string, empty, or whitespace-only entries in either entry-root list;
- negative complexity thresholds;
- values that cannot be cast to the expected integer or boolean type.

The resulting error names the source configuration file.
