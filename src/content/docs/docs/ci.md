---
title: CI and automation
description: Generate machine-readable analysis and apply an explicit build policy.
---

Hyena does not fail a command merely because it found dead code or a complexity violation. This is deliberate: the report describes the codebase, while your repository decides which counts should block a change.

## Pin the tool

Add Hyena as a development dependency so local and CI runs resolve the same package range:

```shell
dart pub add --dev hyena_dart
```

Commit the resulting `pubspec.yaml` and lockfile where your package type normally tracks it.

## Generate JSON

```shell
mkdir -p .hyena
dart run hyena_dart analyze lib \
  --format=json \
  --output=.hyena/report.json
```

The process still fails on operational errors such as invalid arguments, missing files, parse errors, or unresolved dead-code inputs.

## Apply a policy

For a strict no-findings policy with `jq`:

```shell
jq -e '
  (.deadCode.summary.unusedCount == 0) and
  (.complexity.summary.thresholdViolations == 0)
' .hyena/report.json
```

For a gradual policy, compare against agreed limits:

```shell
jq -e '
  (.deadCode.summary.unusedCount <= 5) and
  (.complexity.summary.thresholdViolations <= 3)
' .hyena/report.json
```

Use `dead-code` or `complexity` directly if the policy concerns only one report. This keeps the expected JSON keys simple.

:::tip
Prefer ratcheting limits down over adding broad exclusions. A baseline can make adoption practical while still preventing the count from growing.
:::

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
      - uses: actions/checkout@v4
      - uses: dart-lang/setup-dart@v1

      - name: Resolve dependencies
        run: dart pub get

      - name: Generate report
        run: |
          mkdir -p .hyena
          dart run hyena_dart analyze lib \
            --format=json \
            --output=.hyena/report.json

      - name: Enforce project limits
        run: |
          jq -e '
            (.deadCode.summary.unusedCount <= 5) and
            (.complexity.summary.thresholdViolations <= 3)
          ' .hyena/report.json

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: hyena-report
          path: .hyena/report.json
```

## Keep automation deterministic

- Pass a target path explicitly.
- Commit project configuration rather than constructing it in CI.
- Pin Hyena through the project's dependency resolution.
- Run `dart pub get` before dead-code analysis.
- Keep report artifacts out of source control unless snapshots are intentional.
