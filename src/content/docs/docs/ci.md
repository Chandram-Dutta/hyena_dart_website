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

Non-generated files that cannot be analyzed are skipped with a warning on stderr:

```text
Warning: skipped <path>: <reason>
```

Skips do not directly change the exit code, but missing references can cause dead-code findings that trip `--fail-on`; see [Analysis flow](/docs/analysis/dead-code/#analysis-flow). Generated files that fail dead-code resolution are silently ignored without a warning or `skippedFiles` entry.

Reported skips are listed in the console report and under `skippedFiles` in JSON output; Markdown, HTML, and SARIF reports do not include them. See [Report formats](/docs/reports/).

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

## GitHub Marketplace Action

The [Hyena Dart Action](https://github.com/marketplace/actions/hyena-dart) installs Dart and Hyena, resolves dependencies, and uploads SARIF results to GitHub code scanning. Add this workflow to a Dart package:

```yaml title=".github/workflows/hyena.yml"
name: Hyena analysis

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: Chandram-Dutta/hyena_dart@v3.0.1
        with:
          path: lib
          version: '3.0.1'
```

The action ref pins the workflow implementation; `version` pins the analyzer installed from pub.dev. Findings do not fail the step by default. Add `fail-on: dead-code,complexity` under `with` to fail on findings after uploading the report. Tool errors still fail the run.

For a package in a subdirectory, set `working-directory`; `path`, `config`, and `baseline` are relative to that directory. For Flutter, set up Flutter and run `flutter pub get` first, then set `setup-dart: 'false'` and `pub-get: 'false'`. Code-scanning uploads require GitHub code scanning to be available and `security-events: write`; set `upload: 'false'` to skip the upload. The action exposes `sarif-file` and `exit-code` outputs. See the [input and output definitions](https://github.com/Chandram-Dutta/hyena_dart/blob/v3.0.1/action.yml) for all options and defaults.

### Walk through the demo

The [hyena_dart_demo repository](https://github.com/Chandram-Dutta/hyena_dart_demo) is a small Dart package with a [two-step workflow](https://github.com/Chandram-Dutta/hyena_dart_demo/blob/main/.github/workflows/hyena.yml) that checks out the code and runs the Action on pull requests and pushes to `main`.

1. Open [PR #1: Add shipping rules](https://github.com/Chandram-Dutta/hyena_dart_demo/pull/1), a standing example intended to stay open.
2. In **Files changed**, inspect `lib/src/shipping.dart`: `shippingCents` exceeds the complexity and nesting thresholds, and `legacyHandlingFeeCents` is unused. The code-scanning annotations show each finding beside the source.
3. Compare the findings with the passing Hyena check. The demo does not set `fail-on`, so it reports findings without failing the job.

## Manual GitHub Actions alternative

Use the project-local CLI instead when you want to control installation and report handling yourself. This example uses the dependency pinned above and a committed `hyena-baseline.json`:

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
