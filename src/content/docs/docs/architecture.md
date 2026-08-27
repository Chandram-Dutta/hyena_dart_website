---
title: Architecture and development
description: Understand Hyena's package boundaries, analyzer passes, tests, and contribution workflow.
---

Hyena keeps command parsing, analysis, data, configuration, and rendering in separate modules under `lib/src/`.

```text
bin/hyena_dart.dart
        │
        ▼
HyenaCommandRunner ───────────────┐
        │                         │
        ▼                         ▼
 AnalyzerConfig            Reporter selection
        │                         │
        ├──────────────┐          │
        ▼              ▼          │
DeadCodeAnalyzer  ComplexityAnalyzer
        │              │
        ▼              ▼
 AST declaration, reference, and complexity visitors
        │              │
        └──────┬───────┘
               ▼
      report and metric models
               │
               ▼
 console / JSON / Markdown / HTML
```

## Package layout

| Path | Responsibility |
| --- | --- |
| `bin/hyena_dart.dart` | Executable entry point. |
| `lib/hyena_dart.dart` | Public exports for package consumers. |
| `lib/src/cli/` | Commands, flags, config loading, analyzer orchestration, and output destinations. |
| `lib/src/config/` | Defaults, YAML discovery and parsing, validation, and immutable copies. |
| `lib/src/analyzer/` | File collection, exclusion, analyzer sessions, and report construction. |
| `lib/src/analyzer/ast_visitors/` | Declaration, reference, control-flow, nesting, LOC, and token metric collection. |
| `lib/src/models/` | Analysis results, code entities, dead-code reports, and complexity metrics. |
| `lib/src/reporters/` | Pure report-to-string rendering. |
| `test/` | Unit and analyzer behavior tests. |

Analyzers return models and do not print. The CLI owns terminal and file output. This makes the same analysis usable through both the executable and the library API.

## Dead-code pass

`DeadCodeAnalyzer` resolves all included units before visiting any of them. The declaration visitor maps analyzer element IDs to `CodeEntity` records. The reference visitor builds edges from a containing declaration to every referenced element and identifies graph roots. A final traversal computes reachability.

Export handling is a preprocessing pass over directives because export status affects which declarations and members become roots.

## Complexity pass

`ComplexityAnalyzer` parses each file independently. `ComplexityVisitor` emits one `FunctionMetrics` per function-like body. Dedicated recursive visitors count branch points and nesting while deliberately stopping at nested functions, which are analyzed separately.

File line statistics are calculated outside the AST visitor from the original source text.

## Local development

The repository expects Dart SDK `^3.10.3`.

```shell
git clone https://github.com/Chandram-Dutta/hyena_dart.git
cd hyena_dart
dart pub get
```

Run the same checks used for contributions:

```shell
dart format .
dart analyze
dart test
```

Exercise the CLI against the package itself:

```shell
dart run bin/hyena_dart.dart analyze lib --no-color
```

## Change the right boundary

- **New CLI option:** define it in `lib/src/cli/`, thread it through `AnalyzerConfig` when persistent behavior is needed, and test command semantics.
- **New declaration/reference behavior:** update the focused AST visitor and add a small analyzer fixture or source sample.
- **New metric:** collect it in the complexity visitor, expose it through models and JSON, then update every human-readable reporter.
- **New output format:** implement `Reporter`, add CLI selection, and test escaping and empty-report cases.
- **New public API:** export only stable surfaces from `lib/hyena_dart.dart`.

Keep analyzer logic independent of presentation, and prefer small source fixtures that isolate one Dart syntax feature.

## Before opening a change

1. Add or update tests under `test/`.
2. Run format, static analysis, and the complete test suite.
3. Confirm examples and reporter output when a user-visible shape changed.
4. Update package docs and `CHANGELOG.md` when behavior changes.

See the repository's [contribution context and open issues](https://github.com/Chandram-Dutta/hyena_dart).
