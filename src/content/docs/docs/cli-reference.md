---
title: CLI reference
description: Commands, flags, defaults, and examples for the Hyena Dart executable.
---

The package executable is `hyena_dart`. Source checkouts can use `dart run bin/hyena_dart.dart` instead; project dependencies can use `dart run hyena_dart`.

```text
hyena_dart <command> [options] [path]
```

The first positional value is the target path. It defaults to `.`. Additional positional values are not used.

## Common options

Every analysis command supports these options:

| Option | Short | Value | Default | Behavior |
| --- | --- | --- | --- | --- |
| `--format` | `-f` | `console`, `json`, `markdown`, `html` | `console` | Select the reporter. |
| `--output` | `-o` | file path | — | Write the generated report to a file instead of stdout. |
| `--config` | `-c` | file path | auto-discovered | Load exactly this configuration file. A missing file is an error. |
| `--no-color` | — | flag | off | Disable ANSI colors in console output. Has no effect on other formats. |
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

## Exit behavior

Hyena completes normally after producing a report, even when it contains unused declarations or threshold violations. Invalid arguments, missing targets or config files, parse failures, and dead-code resolution failures are errors.

If a build should fail on findings, consume the JSON report and apply an explicit project policy. See [CI and automation](/docs/ci/).
