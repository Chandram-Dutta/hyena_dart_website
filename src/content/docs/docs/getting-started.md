---
title: Getting started
description: Install Hyena, run a complete analysis, and generate a useful report.
---

This guide runs both analyzers with their defaults and then adds a small project configuration.

## 1. Add Hyena to the project

For Dart:

```shell
dart pub add dev:hyena_dart
```

For Flutter:

```shell
flutter pub add dev:hyena_dart
```

Hyena v2 is run through the project dependency. Every command below resolves the version pinned by this project.

## 2. Resolve the target package

From the Dart or Flutter package you want to inspect:

```shell
dart pub get
```

This creates or updates `.dart_tool/package_config.json`, which dead-code analysis uses to resolve package export URIs.

## 3. Run both analyzers

```shell
dart run hyena_dart analyze .
```

The optional path is the first positional argument. If it is omitted, Hyena uses the current directory. Pointing at `lib` is useful when you do not want to include test and tool code:

```shell
dart run hyena_dart analyze lib
```

You can also inspect one Dart file while iterating:

```shell
dart run hyena_dart analyze lib/src/cache.dart
```

Reported paths always start at the project root, not at the selected target. The two examples above therefore report files such as `lib/src/cache.dart`; a one-file run also reports that same project-relative path.

The console report contains:

- declaration and unused-entity counts;
- dead-code findings grouped by declaration type;
- file, function, and line totals;
- functions that exceed any configured complexity threshold.

## 4. Add a config

Create `hyena.yaml` in the package root:

```yaml title="hyena.yaml"
hyena:
  exclude:
    - "**/fixtures/**"
    - "lib/src/platform/**"

  complexity:
    cyclomatic_threshold: 15
    max_nesting: 4
    max_parameters: 6

  dead_code:
    ignore_main: true
    ignore_exports: false
    ignore_private: false
```

Run the same command again. Hyena searches from the target directory upward and loads the first `hyena.yaml` or `analysis_options.yaml` it finds.

:::tip
Start by excluding only generated or deliberately out-of-scope files. Broad patterns can make a report clean by hiding the code you intended to inspect.
:::

## 5. Write a reviewable report

```shell
dart run hyena_dart analyze lib \
  --format=markdown \
  --output=hyena-report.md
```

For data processing or CI, choose JSON instead:

```shell
dart run hyena_dart analyze lib --format=json --output=hyena-report.json
```

To make findings enforceable without failing on existing debt, create a baseline once and commit it:

```shell
dart run hyena_dart analyze lib --write-baseline=hyena-baseline.json
dart run hyena_dart analyze lib \
  --baseline=hyena-baseline.json \
  --fail-on=dead-code,complexity
```

## Read the result correctly

- A threshold is violated only when a metric is **greater than** its limit. A cyclomatic score of 20 does not violate the default threshold of 20.
- The CLI returns 0 for findings by default. Use `--fail-on` to select which finding categories should return exit code 1. See [CI and automation](/docs/ci/).
- Unused public and private declarations are both reported by default in v2. Reusable package authors can preserve exported public API with `ignore_exports: true` or `--ignore-exports`.
- Dead-code findings are static reachability results. Reflection, generated registration, and behavior outside the scanned source can require exclusions or manual review.

Next: use the [CLI reference](/docs/cli-reference/) or read how [dead-code reachability](/docs/analysis/dead-code/) works.
