---
title: Installation
description: Install Hyena as a global CLI, project development dependency, or source checkout.
---

Hyena requires **Dart SDK 3.10 or newer**. Flutter projects can use the Dart SDK bundled with Flutter.

## Global CLI

Use global activation when you want one `hyena_dart` executable available across projects.

```shell
dart pub global activate hyena_dart
hyena_dart analyze .
```

If your shell cannot find `hyena_dart`, add Dart's global executable directory to `PATH`. `dart pub global list` confirms whether activation succeeded.

:::note
The command runner's help banner says `Usage: hyena ...`, but the executable installed by the package is named `hyena_dart`.
:::

## Project development dependency

Pin Hyena with the project when the analysis version should be reproducible across a team or CI.

```shell
dart pub add --dev hyena_dart
dart run hyena_dart analyze .
```

This updates `pubspec.yaml` and resolves the package. Commit the resulting dependency files according to the normal rules for your Dart or Flutter project.

## Source checkout

Use a checkout when contributing or testing changes not yet published.

```shell
git clone https://github.com/Chandram-Dutta/hyena_dart.git
cd hyena_dart
dart pub get
dart run bin/hyena_dart.dart analyze /path/to/project
```

For a path dependency in another project's `pubspec.yaml`:

```yaml title="pubspec.yaml"
dev_dependencies:
  hyena_dart:
    path: ../hyena_dart
```

Then invoke it with `dart run hyena_dart ...` from that project.

## Prepare the target

Before running dead-code analysis, resolve the target package:

```shell
dart pub get
```

Dead-code analysis asks the official Dart analyzer to resolve every included Dart file. It stops and lists failures if any included file has an analyzer error. Complexity-only analysis parses syntax and does not require resolved elements.

## Confirm the installation

```shell
hyena_dart --help
hyena_dart complexity --help
hyena_dart --version
hyena_mcp --version
```

You should see the `analyze`, `dead-code`, and `complexity` commands. With the current Hyena Dart 1.2.1 release, the version commands print `hyena_dart 1.2.1` and `hyena_mcp 1.2.1` respectively.
