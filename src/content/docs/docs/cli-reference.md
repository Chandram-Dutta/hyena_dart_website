---
title: CLI reference
description: Commands, flags, defaults, and examples for the Hyena Dart executable.
---

The primary analysis CLI executable is `hyena_dart`. Source checkouts can use `dart run bin/hyena_dart.dart` instead; project dependencies can use `dart run hyena_dart`.

Hyena Dart 1.1.2 introduced a separate, bounded `hyena_mcp` executable. It does not expose the regular CLI flags or reporters; see [Safe AI and MCP](/docs/safe-ai-mcp/) for its exact contract.

```text
hyena_dart <command> [options] [path]
```

## Version output

:::note[Available in v1.2.0]
Both version flags are included in Hyena Dart 1.2.0 and later. The MCP server itself was introduced in v1.1.2; its `--version` flag was added in v1.2.0.
:::

Both executables can print their package version and exit without starting analysis or an MCP session:

```shell
hyena_dart --version
hyena_mcp --version
```

The output is one line with the executable name followed by the package version:

```text
hyena_dart 1.2.0
hyena_mcp 1.2.0
```

`hyena_mcp --version` does not require `--root`. This makes it safe to identify the executable that an MCP client will launch before granting access to a project.

Hyena's release checks compare the runtime version with `pubspec.yaml` during CI and again before publication. A mismatch stops the release, so a published executable should not report a version different from its package.

The first positional value is a Dart file or directory target. It defaults to `.`. Additional positional values are not used.

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
hyena_dart analyze [path] [options]
```

| Option | Default | Behavior |
| --- | --- | --- |
| `--[no-]dead-code` | on | Include or skip dead-code analysis. |
| `--[no-]complexity` | on | Include or skip complexity analysis. |

Examples:

```shell
# Both analyzers, console output
hyena_dart analyze lib

# JSON file for tooling
hyena_dart analyze . --format=json --output=.hyena/report.json

# Complexity only through the combined command
hyena_dart analyze lib --no-dead-code
```

The `analyze` command takes thresholds and dead-code behavior from configuration. It does not expose the `complexity --threshold` or `dead-code --ignore-*` overrides.

## `dead-code`

Run only declaration and reference reachability analysis.

```shell
hyena_dart dead-code [path] [options]
```

| Option | Default | Behavior |
| --- | --- | --- |
| `--[no-]ignore-exports` | on | Treat directly exported declarations and public members of exported containers as roots. |
| `--[no-]ignore-private` | off | Treat private declarations as roots and omit them from findings. |

The command-line values override config only when the flag was explicitly passed. For example:

```shell
# Include exported declarations as candidates
hyena_dart dead-code lib --no-ignore-exports

# Omit private declarations from findings
hyena_dart dead-code lib --ignore-private
```

`ignore_main` is configurable in YAML but has no command-line override.

## `complexity`

Run only complexity and line-metric analysis.

```shell
hyena_dart complexity [path] [options]
```

| Option | Short | Default | Behavior |
| --- | --- | --- | --- |
| `--threshold` | `-t` | `20` | Override the cyclomatic threshold with a non-negative integer. |

The override applies only when `--threshold` is explicitly passed. Nesting and parameter limits remain configured by YAML.

```shell
hyena_dart complexity lib --threshold=15
hyena_dart complexity lib -f html -o complexity.html
```

A non-integer or negative threshold is a usage error.

## Baselines and source suppressions

Create and commit a baseline when existing findings are accepted temporarily:

```shell
hyena_dart analyze . --write-baseline=hyena-baseline.json
hyena_dart analyze . \
  --baseline=hyena-baseline.json \
  --fail-on=dead-code,complexity
```

`--baseline` and `--write-baseline` cannot be used together. Baselines use package-relative, line-independent fingerprints, so moving an unchanged declaration does not invalidate its entry. Rename or move a symbol to another file and it is treated as a new finding.

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

Invalid arguments, missing targets or config files, parse failures, and dead-code resolution failures remain operational errors. See [CI and automation](/docs/ci/) for complete examples.
