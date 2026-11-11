---
title: CI and automation
description: Gate selected findings, adopt baselines, and publish JSON or SARIF reports in CI.
---

Hyena returns exit code 0 for findings by default. CI can opt into exit code 1 for dead code, complexity violations, or both with `--fail-on`. Tool errors exit 2, so CI can tell real findings apart from a broken setup.

## Pin the tool

Add Hyena as a development dependency so local and CI runs resolve the same package range:

```shell
dart pub add dev:hyena_dart
```

Commit the resulting `pubspec.yaml` and lockfile where your package type normally tracks it.

## Gate selected findings

```shell
dart run hyena_dart analyze lib \
  --fail-on=dead-code,complexity
```

The gate runs after source suppressions and baseline filtering. Usage errors and tool errors, such as a missing config file or target, also fail the process with their own exit codes; see [Exit codes](#exit-codes).

Use one category when the job is narrower:

```shell
dart run hyena_dart dead-code lib --fail-on=dead-code
dart run hyena_dart complexity lib --fail-on=complexity
```

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Analysis completed. Either there were no findings, or no finding matched a `--fail-on` category. Findings never fail the run without `--fail-on`. |
| `1` | Analysis completed and findings matched a `--fail-on` category. |
| `2` | Tool error: Hyena could not finish. Causes include a missing or invalid config or baseline file, a target path that doesn't exist or can't be read, an analysis failure that stops the whole run, a report that can't be written, or an unexpected internal error. |
| `64` | Usage error: unknown command or flag, invalid option value, or conflicting options. |

A tool error takes precedence. If Hyena fails, it exits `2` even when findings would have tripped `--fail-on`.

:::caution[Changed in v3.0.0]
Before v3.0.0, tool errors exited `1`, the same code as findings. Exit `1` now means only that findings tripped `--fail-on`. See [Migrating to v3.0](/docs/migrating-to-v3/#update-ci-for-the-new-exit-codes).
:::

`hyena_mcp` exits `64` for usage errors, such as a missing `--root`, and `2` when the server can't start, such as a `--root` directory that doesn't exist.

## Skipped files

Individual files that fail to resolve, contain analysis or syntax errors, or can't be read are not tool errors. Hyena skips them, prints a line to stderr, and keeps analyzing the rest of the target:

```text
Warning: skipped <path>: <reason>
```

Skipped files do not change the exit code. They are listed in the console report and under `skippedFiles` in JSON output; Markdown, HTML, and SARIF reports do not include them. See [Report formats](/docs/reports/).

In CI, make sure generated code is up to date before analysis, for example by running `build_runner` first. If a skipped file should fail the build, check stderr or the JSON `skippedFiles` arrays.

## Adopt with a baseline

Generate a baseline from findings that the project accepts today:

```shell
dart run hyena_dart analyze lib \
  --write-baseline=hyena-baseline.json
```

Review and commit the versioned JSON file, then gate only findings not present in it:

```shell
dart run hyena_dart analyze lib \
  --baseline=hyena-baseline.json \
  --fail-on=dead-code,complexity
```

Fingerprints use the rule, project- or workspace-relative path, symbol type, and symbol identity rather than a source line. Adding lines above an unchanged finding does not invalidate it. Renames and moves to another file intentionally appear as new findings.

Existing v1.x baselines remain compatible with v2. Baseline paths were already relative; do not regenerate the file solely because console, JSON, Markdown, and HTML now consistently use project-relative paths.

:::tip
Refresh a baseline only after reviewing the difference. Rewriting it automatically on every CI run would accept the new findings that it is meant to catch.
:::

## Publish machine-readable results

JSON is useful for custom policies and data processing:

```shell
dart run hyena_dart analyze lib \
  --format=json \
  --output=.hyena/report.json
```

SARIF 2.1 is designed for code-scanning systems:

```shell
dart run hyena_dart analyze lib \
  --baseline=hyena-baseline.json \
  --format=sarif \
  --output=.hyena/hyena.sarif \
  --fail-on=dead-code,complexity
```

Because a finding gate can return exit code 1 after writing the report, use an `if: always()` upload step when the artifact must be retained on failures.

## GitHub Actions example

```yaml title=".github/workflows/hyena.yml"
name: Hyena analysis

on:
  pull_request:
  push:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: dart-lang/setup-dart@v1

      - name: Resolve dependencies
        run: dart pub get

      - name: Analyze
        run: |
          mkdir -p .hyena
          dart run hyena_dart analyze lib \
            --baseline=hyena-baseline.json \
            --format=sarif \
            --output=.hyena/hyena.sarif \
            --fail-on=dead-code,complexity

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: hyena-report
          path: .hyena/hyena.sarif
```

## Keep automation deterministic

- Pass a target path explicitly.
- Commit project configuration rather than constructing it in CI.
- Commit and review the baseline when using gradual adoption.
- Pin Hyena through the project's dependency resolution.
- Run `dart pub get`, and any code generation, before dead-code analysis.
- Keep report artifacts out of source control unless snapshots are intentional.
