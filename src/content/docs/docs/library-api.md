---
title: Library API
description: Configure and run Hyena analyzers, inspect models, and generate reports from Dart code.
---

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
- `analyzedAt`;
- `toJson()`.

Each `CodeEntity` includes its `name`, `EntityType`, file, line, column, optional parent, visibility, and export status. `fullName` and `typeLabel` provide display values.

### `ComplexityAnalyzer`

```dart
final report = await ComplexityAnalyzer(config).analyze('lib');
```

`ComplexityReport` exposes file and function totals, configured thresholds, high-complexity/nesting/parameter lists, the combined `thresholdViolations` list, and `toJson()`.

The nested models are:

- `FileMetrics`: line counts, functions, average complexity, and maximum complexity;
- `FunctionMetrics`: location, complexity metrics, Halstead volume, and calculated maintainability index.

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

Its `toJson()` omits absent analyzer sections.

## Generate output

Built-in reporters are:

```dart
final reporters = <Reporter>[
  ConsoleReporter(useColors: false),
  JsonReporter(prettyPrint: true),
  MarkdownReporter(),
  HtmlReporter(),
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

## Embed the CLI

`HyenaCommandRunner` is exported for applications that need to invoke the command parser directly:

```dart
await HyenaCommandRunner().run(['complexity', 'lib', '--threshold=15']);
```

For most integrations, calling analyzers and reporters directly provides clearer control over I/O and errors.
