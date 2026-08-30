---
title: Complexity analysis
description: See exactly how Hyena counts cyclomatic complexity, nesting, LOC, parameters, Halstead volume, and maintainability.
---

Complexity analysis parses every included Dart file and emits metrics for top-level functions, methods, constructors, and closures. Nested closures are reported separately and excluded from the enclosing function's measurements.

## Reported units

Each `FunctionMetrics` record contains:

| Field | Meaning |
| --- | --- |
| `name` | Function name, `Class.method`, `Class.new`, named constructor, or `<closure@line:column>`. |
| `filePath` / `line` | Project-relative source location, or workspace-relative location for a workspace. |
| `cyclomaticComplexity` | Base path plus counted branch points. |
| `linesOfCode` | Unique non-blank physical lines in the executable body and constructor initializers. |
| `maxNestingLevel` | Deepest counted control structure. |
| `parameterCount` | Number of formal parameters. |
| `halsteadVolume` | Token-derived program length × log₂(vocabulary). |
| `maintainabilityIndex` | Normalized 0–100 score derived from volume, complexity, and LOC. |

## Cyclomatic complexity

Every function starts at **1**. Hyena adds one for each:

- `assert` statement or constructor assert initializer;
- `if` statement;
- `for`, `for-in`, `while`, or `do` loop;
- collection `for` or collection `if`;
- switch statement case, switch pattern case, or switch expression case;
- `catch` clause;
- conditional expression (`condition ? a : b`);
- `&&`, `||`, or `??` binary expression.

Nested function and closure bodies do not increase the enclosing function's score; each closure gets its own record.

```dart
String label(User? user, bool compact) {
  if (user == null || !user.active) { // +1 if, +1 ||
    return 'unknown';
  }
  return compact ? user.id : user.name; // +1 conditional
}
```

This function starts at 1 and has a cyclomatic complexity of 4.

## Nesting

Hyena enters a nesting level for:

- `if`;
- loops and collection `for`;
- collection `if`;
- switch statements and expressions;
- `try` statements.

`catch` increases cyclomatic complexity but does not add a separate nesting level. Conditional and binary expressions also do not add nesting.

## Lines of code

Function LOC is the count of unique non-blank physical lines covered by its body and, for constructors, initializer list. Nested closure bodies are blanked before the outer function is counted.

Comments inside a function body are retained and count when the line is non-blank. This is a physical-size metric rather than a statement count.

File-level line totals use a simpler line-prefix classifier:

- blank trimmed lines are blank;
- lines starting with `//` are comments;
- lines in a block beginning with `/*` are comments until a line containing `*/`;
- everything else is code, including code with a trailing inline comment.

## Halstead volume and maintainability

Halstead operands include identifiers, literals, `true`, `false`, `null`, `this`, and `super`. Operators include operator and keyword tokens; common delimiters such as braces, brackets, parentheses, commas, and semicolons are omitted.

Volume is calculated as:

```text
volume = tokenCount × log2(uniqueOperators + uniqueOperands)
```

The maintainability index is:

```text
raw = 171 - 5.2 × ln(max(volume, 1))
          - 0.23 × cyclomaticComplexity
          - 16.2 × ln(max(linesOfCode, 1))

index = clamp(raw × 100 / 171, 0, 100)
```

Higher values indicate a smaller, less complex function under this formula. Use the score for comparison and triage, not as a universal quality grade.

## Thresholds

Defaults:

| Metric | Default limit |
| --- | ---: |
| Cyclomatic complexity | 20 |
| Maximum nesting | 5 |
| Parameters | 6 |

A function is in `thresholdViolations` if **any** metric is strictly greater than its limit. Equal values pass. Violations are sorted by descending cyclomatic complexity.

Configure all limits in YAML or override only cyclomatic complexity on the dedicated command:

```shell
dart run hyena_dart complexity lib --threshold=15
```

See [configuration](/docs/configuration/) for the complete schema.

## Suppress an intentional violation

Place `// hyena:ignore complexity` immediately before an executable to suppress all three threshold rules for it:

```dart
// hyena:ignore complexity
void generatedDispatcher() {
  // Framework-required control flow.
}
```

Use a specific rule when only one metric is intentionally above its threshold:

```dart
// hyena:ignore cyclomatic-complexity,max-nesting
void stateMachine() {}

// hyena:ignore max-parameters
void frameworkCallback(int a, int b, int c, int d, int e, int f, int g) {}
```

Rule-specific suppressions do not hide other complexity violations on the same executable.
