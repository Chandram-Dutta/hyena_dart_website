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

Threshold comparisons are strict: **metric > threshold**. Equality is not a violation.

## Discovery

Without `--config`, Hyena:

1. resolves the target to an absolute path;
2. starts in that directory (or the parent if the target is a file);
3. checks `hyena.yaml`, then `analysis_options.yaml`;
4. walks upward until a file is found or the filesystem root is reached.

Because `hyena.yaml` is checked first in each directory, it wins over an `analysis_options.yaml` beside it.

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
- negative complexity thresholds;
- values that cannot be cast to the expected integer or boolean type.

The resulting error names the source configuration file.
