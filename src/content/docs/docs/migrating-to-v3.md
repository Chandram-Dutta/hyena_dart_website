---
title: Migrating to v3.0
description: Move a Hyena Dart v2.x setup to Dart 3.11 and analyzer 14, replace removed library exports, and update CI for the new exit codes.
sidebar:
  label: Migrate to v3.0
---

:::note[Current release]
Hyena Dart v3.0.0 is available on [pub.dev](https://pub.dev/packages/hyena_dart) and as a [GitHub release](https://github.com/Chandram-Dutta/hyena_dart/releases/tag/v3.0.0).
:::

## Update the SDK and analyzer

Hyena v3 requires **Dart SDK 3.11 or newer** and depends on `analyzer: ^14.0.0`. Update the dependency constraint:

```yaml title="pubspec.yaml"
dev_dependencies:
  hyena_dart: ^3.0.0
```

Because Hyena is a development dependency, other dev tools in the same project, such as code generators and custom lint plugins, must also accept analyzer 14.x. If one still requires an older analyzer, `pub get` reports a version conflict; upgrade that tool before upgrading Hyena.

The install and run commands are unchanged:

```shell
dart pub add dev:hyena_dart
dart run hyena_dart analyze .
```

## Replace removed library exports

`package:hyena_dart/hyena_dart.dart` no longer exports the CLI runner or the internal path helpers:

| Removed | Use instead |
| --- | --- |
| `HyenaCommandRunner`, `BaseAnalysisCommand`, `AnalyzeCommand`, `DeadCodeCommand`, `ComplexityCommand` | The CLI (`dart run hyena_dart`), or the still-public `AnalysisRunner`, `DeadCodeAnalyzer`, `ComplexityAnalyzer`, and reporter APIs. |
| `analysisRootForTarget`, `relativeAnalysisPath`, `relativeFindingPath` | `package:path`, for example `p.relative(entity.filePath)`. |

Projects that use only the CLI or MCP server do not need changes here. See [Library API](/docs/library-api/) for the remaining public surface.

## Update CI for the new exit codes

| Code | Meaning |
| --- | --- |
| `0` | Analysis completed. Findings never fail the run without `--fail-on`. |
| `1` | Analysis completed and findings matched a `--fail-on` category. |
| `2` | Tool error: Hyena could not finish. |
| `64` | Usage error. |

In v2, tool errors such as a missing config file or unreadable target exited `1`. They now exit `2`, so `1` means only that findings tripped `--fail-on`. Scripts that treated any non-zero code as "findings" should check for `1` explicitly. See [Exit codes](/docs/ci/#exit-codes) for the full list of causes.

`hyena_mcp` still exits `64` for usage errors such as a missing `--root`, and now exits `2` when it cannot start, for example when the `--root` directory does not exist.

## Expect skipped files instead of aborted runs

A Dart file that fails to resolve, has analysis or syntax errors, or cannot be read is now skipped. Hyena prints a line like this to stderr and keeps analyzing the rest of the target:

```text
Warning: skipped <path>: <reason>
```

In v2, such a file aborted the run. Skipped files do not change the exit code. In CI, make sure generated code is up to date, for example by running `build_runner` first, and check stderr or the JSON `skippedFiles` arrays if a skipped file should fail the build. See [Report formats](/docs/reports/) for where skipped files appear.

Library callers no longer receive a `StateError` from `DeadCodeAnalyzer.analyze` or a `FormatException` from `ComplexityAnalyzer.analyze` for such files; check `skippedFiles` on the returned reports instead.

## Remove generated-file excludes

Generated `.g.dart`, `.freezed.dart`, and `.mocks.dart` files are now handled automatically. Dead-code analysis counts references from them, including `part` files, and never reports their declarations; complexity analysis skips them. Remove those suffixes from `exclude` so declarations used only by generated code stay reachable. A user `exclude` pattern still removes a matching file from analysis entirely.

## Migration checklist

1. Move the project to Dart SDK 3.11 or newer and confirm other dev tools accept analyzer 14.x.
2. Update the dependency to `hyena_dart: ^3.0.0` and resolve dependencies.
3. Replace any use of the removed CLI-runner and path-helper exports.
4. Update CI scripts that interpret exit codes, distinguishing `1` from `2`.
5. Decide how CI should treat skipped files, and regenerate code before analysis.
6. Remove `*.g.dart`, `*.freezed.dart`, and `*.mocks.dart` from `exclude`.

The [v2.0 migration guide](/docs/migrating-to-v2/) remains available for projects upgrading from v1.x.
