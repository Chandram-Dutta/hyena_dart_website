---
title: Library API
description: Configure and run Hyena analyzers, inspect models, and generate reports from Dart code.
---

This page shows practical examples. For every public class, member, and signature, see the [generated API reference on pub.dev](https://pub.dev/documentation/hyena_dart/latest/), the canonical API documentation.

Import the package's stable public surface:

```dart
import 'package:hyena_dart/hyena_dart.dart';
```

## Run both analyzers

```dart title="tool/analyze.dart"
import 'dart:io';

import 'package:hyena_dart/hyena_dart.dart';

Future<void> main() async {
  const target = 'lib';
  final config = await AnalyzerConfig.load(null, targetPath: target);
  final stopwatch = Stopwatch()..start();

  final deadCode = await DeadCodeAnalyzer(config).analyze(target);
  final complexity = await ComplexityAnalyzer(config).analyze(target);

  stopwatch.stop();
  final result = AnalysisResult(
    targetPath: target,
    duration: stopwatch.elapsed,
    deadCodeReport: deadCode,
    complexityReport: complexity,
  );

  final output = await JsonReporter().generate(result);
  await File('hyena-report.json').writeAsString(output);
}
```

`AnalyzerConfig.load()` applies the same explicit-file or upward-discovery behavior as the CLI. Construct `AnalyzerConfig` directly when all values come from code:

```dart
final config = AnalyzerConfig(
  excludePatterns: ['**/fixtures/**'],
  cyclomaticThreshold: 15,
  maxNestingLevel: 4,
  maxParameters: 6,
  ignoreMain: true,
  ignoreExports: true,
  ignorePrivate: false,
);
```

Use `copyWith()` to change a subset of an existing config.

## Analyzer return values

### `DeadCodeAnalyzer`

```dart
final report = await DeadCodeAnalyzer(config).analyze('lib');
```

`DeadCodeReport` exposes:

- `unusedEntities` and derived `unusedCount`;
- `totalDeclarations` and `deadCodePercentage`;
- `groupedByType` and `groupedByFile`;
- `skippedFiles`;
- `analyzedAt`;
- `toJson()`.

Each `CodeEntity` includes its `name`, `EntityType`, file, line, column, optional parent, visibility, and export status. `fullName` and `typeLabel` provide display values. For a display path, use `package:path`:

```dart
import 'package:path/path.dart' as p;

for (final entity in report.unusedEntities) {
  print('${entity.typeLabel} ${entity.fullName} (${p.relative(entity.filePath)})');
}
```

### `ComplexityAnalyzer`

```dart
final report = await ComplexityAnalyzer(config).analyze('lib');
```

`ComplexityReport` exposes file and function totals, configured thresholds, high-complexity/nesting/parameter lists, the combined `thresholdViolations` list, `skippedFiles`, and `toJson()`.

The nested models are:

- `FileMetrics`: line counts, functions, average complexity, and maximum complexity;
- `FunctionMetrics`: location, complexity metrics, Halstead volume, and calculated maintainability index.

For the complete field list of every model, see the [API reference](https://pub.dev/documentation/hyena_dart/latest/).

### Skipped files

A file that fails to resolve, has analysis or syntax errors, or cannot be read does not abort `analyze`. It is left out of the report and recorded in the report's `skippedFiles` list as a `SkippedFile` with an absolute `filePath` and a single-line `reason`:

```dart
for (final skipped in report.skippedFiles) {
  stderr.writeln('Skipped ${p.relative(skipped.filePath)}: ${skipped.reason}');
}
```

:::note[Changed in v3.0.0]
Before v3.0.0, `DeadCodeAnalyzer.analyze` threw a `StateError` and `ComplexityAnalyzer.analyze` threw a `FormatException` for such files. Check `skippedFiles` instead.
:::

The analyzers also accept optional `resolveUnit` (`DeadCodeAnalyzer`) and `readSource` (`ComplexityAnalyzer`) constructor hooks, intended mainly for testing failure handling.

## Combine results

`AnalysisResult` can contain either or both report types:

```dart
final result = AnalysisResult(
  targetPath: target,
  duration: elapsed,
  deadCodeReport: deadCode,
  complexityReport: null,
);
```

Its `toJson()` omits absent analyzer sections. `AnalysisResult.skippedFiles` aggregates skipped files from every included report, including workspace packages.

## Generate output

Built-in reporters are:

```dart
final reporters = <Reporter>[
  ConsoleReporter(useColors: false),
  JsonReporter(prettyPrint: true),
  MarkdownReporter(),
  HtmlReporter(),
  SarifReporter(),
];

for (final reporter in reporters) {
  final content = await reporter.generate(result);
  // Store or publish content as appropriate.
}
```

Analyzers do not print. Reporters return a `Future<String>`, leaving file I/O and transport to the caller.

To add a format, implement `Reporter`:

```dart
class SummaryReporter implements Reporter {
  @override
  Future<String> generate(AnalysisResult result) async {
    final unused = result.deadCodeReport?.unusedCount ?? 0;
    final violations =
        result.complexityReport?.thresholdViolations.length ?? 0;
    return 'unused=$unused violations=$violations';
  }
}
```

## Analyze a package or workspace

`AnalysisRunner` is the entry point the CLI uses. It loads configuration, handles single packages and Dart workspaces, and returns one `AnalysisResult`:

```dart
final result = await const AnalysisRunner().analyze('.');
print('Packages: ${result.packageAnalyses.length}');
```

:::note[Removed in v3.0.0]
The public library no longer exports the CLI runner (`HyenaCommandRunner`, `BaseAnalysisCommand`, `AnalyzeCommand`, `DeadCodeCommand`, `ComplexityCommand`) or the path helpers (`analysisRootForTarget`, `relativeAnalysisPath`, `relativeFindingPath`). Run the CLI with `dart run hyena_dart`, or use `AnalysisRunner`, the analyzers, and reporters. Compute display paths with `package:path`. See [Migrating to v3.0](/docs/migrating-to-v3/#replace-removed-library-exports).
:::
