---
title: CLI reference
description: Commands, flags, defaults, and examples for the Hyena Dart executable.
---

Hyena runs from the project's resolved development dependency. Invoke the analysis entry point with `dart run hyena_dart`; global command mappings are not supported (since v2).

Hyena Dart 1.1.2 introduced the separate, bounded MCP entry point, now invoked as `dart run hyena_dart:hyena_mcp`. It does not expose the regular CLI flags or reporters; see [Safe AI and MCP](/docs/safe-ai-mcp/) for its exact contract.

```text
dart run hyena_dart <command> [options] [path]
```

## Version output

:::note[Available in v1.2.0]
Both version flags are included in Hyena Dart 1.2.0 and later. The MCP server itself was introduced in v1.1.2; its `--version` flag was added in v1.2.0.
:::

Both executables can print their package version and exit without starting analysis or an MCP session:

```shell
dart run hyena_dart --version
dart run hyena_dart:hyena_mcp --version
```

The output is one line with the executable name followed by the package version:

```text
hyena_dart 3.0.0
hyena_mcp 3.0.0
```

The MCP version command does not require `--root`. This makes it safe to identify the project-resolved entry point before granting access to a project.

Hyena's release checks compare the runtime version with `pubspec.yaml` during CI and again before publication. A mismatch stops the release, so a published executable should not report a version different from its package.

The first positional value is a Dart file or directory target. It defaults to `.`. Additional positional values are a usage error (exit code 64). Reported targets and source files are always relative to the package root, or to the common workspace root for a workspace; selecting `lib` or one file does not change that path basis.

## Common options

Every analysis command supports these options:

| Option | Short | Value | Default | Behavior |
| --- | --- | --- | --- | --- |
| `--format` | `-f` | `console`, `json`, `markdown`, `html`, `sarif` | `console` | Select the reporter. |
| `--output` | `-o` | file path | — | Write the generated report to a file instead of stdout. |
| `--config` | `-c` | file path | auto-discovered | Load exactly this configuration file. A missing file is an error. |
| `--no-color` | — | flag | off | Disable ANSI colors in console output. Has no effect on other formats. |
| `--baseline` | — | file path | — | Suppress findings recorded in a versioned Hyena baseline. |
| `--write-baseline` | — | file path | — | Write the current findings to a baseline file. |
| `--fail-on` | — | `dead-code`, `complexity` | none | Return exit code 1 when an unsuppressed finding in a selected category remains. Repeat the option or separate categories with commas. |
| `--help` | `-h` | flag | — | Print command usage. |

When `--output` is set, Hyena writes the file and prints `Report written to: <path>`.

## `analyze`

Run dead-code and complexity analysis and combine both reports.

```shell
dart run hyena_dart analyze [path] [options]
```

| Option | Default | Behavior |
| --- | --- | --- |
| `--[no-]dead-code` | on | Include or skip dead-code analysis. |
| `--[no-]complexity` | on | Include or skip complexity analysis. |
| `--[no-]ignore-exports` | off | Treat exported public API as roots and omit it from dead-code findings. |
| `--[no-]ignore-private` | off | Treat private declarations as roots and omit them from dead-code findings. |

At least one analyzer must remain enabled; passing both `--no-dead-code` and `--no-complexity` is a usage error (exit code 64).

Examples:

```shell
# Both analyzers, console output
dart run hyena_dart analyze lib

# JSON file for tooling
dart run hyena_dart analyze . --format=json --output=.hyena/report.json

# Complexity only through the combined command
dart run hyena_dart analyze lib --no-dead-code

# Preserve a reusable package's exported public API
dart run hyena_dart analyze . --ignore-exports
```

The `analyze` command takes complexity thresholds and other dead-code behavior from configuration. It accepts `--ignore-exports` and `--ignore-private` overrides, but does not expose `complexity --threshold`.

## `dead-code`

Run only declaration and reference reachability analysis.

```shell
dart run hyena_dart dead-code [path] [options]
```

| Option | Default | Behavior |
| --- | --- | --- |
| `--[no-]ignore-exports` | off | Treat directly exported declarations and public members of exported containers as roots. |
| `--[no-]ignore-private` | off | Treat private declarations as roots and omit them from findings. |

The command-line values override config only when the flag was explicitly passed. For example:

```shell
# Preserve exported declarations for external package consumers
dart run hyena_dart dead-code lib --ignore-exports

# Omit private declarations from findings
dart run hyena_dart dead-code lib --ignore-private
```

`ignore_main` is configurable in YAML but has no command-line override.

## `complexity`

Run only complexity and line-metric analysis.

```shell
dart run hyena_dart complexity [path] [options]
```

| Option | Short | Default | Behavior |
| --- | --- | --- | --- |
| `--threshold` | `-t` | `20` | Override the cyclomatic threshold with a non-negative integer. |

The override applies only when `--threshold` is explicitly passed. Nesting and parameter limits remain configured by YAML.

```shell
dart run hyena_dart complexity lib --threshold=15
dart run hyena_dart complexity lib -f html -o complexity.html
```

A non-integer or negative threshold is a usage error (exit code 64).

## Baselines and source suppressions

Create and commit a baseline when existing findings are accepted temporarily:

```shell
dart run hyena_dart analyze . --write-baseline=hyena-baseline.json
dart run hyena_dart analyze . \
  --baseline=hyena-baseline.json \
  --fail-on=dead-code,complexity
```

`--baseline` and `--write-baseline` cannot be used together. Baselines use package- or workspace-relative, line-independent fingerprints, so moving an unchanged declaration does not invalidate its entry. Rename or move a symbol to another file and it is treated as a new finding. Existing v1.x baselines remain valid in v2.

For an intentional exception in source, place a rule comment immediately before the declaration:

```dart
// hyena:ignore dead-code
void registeredByName() {}

// hyena:ignore complexity
void generatedDispatcher() {}

// hyena:ignore cyclomatic-complexity,max-nesting
void stateMachine() {}
```

The supported rules are `dead-code`, `complexity`, `cyclomatic-complexity`, `max-nesting`, and `max-parameters`. A suppressed dead-code declaration remains a reachability root, preventing cascading findings for its dependencies.

## Exit behavior

Hyena returns exit code 0 after reporting findings by default. Pass `--fail-on=dead-code`, `--fail-on=complexity`, or `--fail-on=dead-code,complexity` to return exit code 1 when a selected, unsuppressed finding remains. This applies after baseline filtering.

| Code | Meaning |
| --- | --- |
| `0` | Analysis completed. Findings never fail the run without `--fail-on`. |
| `1` | Analysis completed and findings matched a `--fail-on` category. |
| `2` | Tool error: a missing or invalid config or baseline file, a missing or unreadable target, an analysis failure that stops the whole run, a report write failure, or an unexpected internal error. |
| `64` | Usage error: unknown command or flag, invalid option value, or conflicting options. |

A tool error takes precedence over `--fail-on`. Before v3.0.0, tool errors exited `1`.

Skipped non-generated files produce `Warning: skipped <path>: <reason>` on stderr; generated files that fail dead-code resolution are silently ignored without a `skippedFiles` entry. Skips do not directly change the exit code, but missing references can cause dead-code findings that trip `--fail-on`; see [Analysis flow](/docs/analysis/dead-code/#analysis-flow).

`hyena_mcp` exits `64` for usage errors such as a missing `--root`, and `2` when it cannot start, such as a `--root` directory that does not exist. See [CI and automation](/docs/ci/#exit-codes) for complete examples.
