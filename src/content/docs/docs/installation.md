---
title: Installation
description: Add Hyena to a Dart or Flutter project and run the project-pinned command.
---

Hyena requires **Dart SDK 3.10.3 or newer (below 4.0.0)**. Flutter projects can use the Dart SDK bundled with Flutter.

:::note[Available in v2.0.0]
Project-local installation and execution is the supported workflow in the current v2.0.0 release.
:::

## Add the development dependency

For a Dart project:

```shell
dart pub add dev:hyena_dart
```

For a Flutter project:

```shell
flutter pub add dev:hyena_dart
```

Both commands update the project's `pubspec.yaml` and resolve Hyena into that project's package configuration. Commit the resulting dependency files according to the normal rules for the project.

Hyena v2 supports only project-local execution. Run it from the project that declares the dependency:

```shell
dart run hyena_dart analyze .
```

This resolves the Hyena version selected by the project's lockfile. It keeps local development and CI on the same analyzer version and avoids a separate global command mapping.

## Source checkout

Use a checkout when contributing to Hyena itself:

```shell
git clone https://github.com/Chandram-Dutta/hyena_dart.git
cd hyena_dart
dart pub get
dart run bin/hyena_dart.dart analyze .
```

To test that checkout from another project, declare it as a project-local path dependency:

```yaml title="pubspec.yaml"
dev_dependencies:
  hyena_dart:
    path: ../hyena_dart
```

Then run `dart pub get` and invoke `dart run hyena_dart ...` from the consuming project.

## Prepare the target

Before running dead-code analysis, resolve the target package:

```shell
dart pub get
```

Dead-code analysis asks the official Dart analyzer to resolve every included Dart file. It stops and lists failures if any included file has an analyzer error. Complexity-only analysis parses syntax and does not require resolved elements.

## Confirm the installation

```shell
dart run hyena_dart --help
dart run hyena_dart complexity --help
dart run hyena_dart --version
dart run hyena_dart:hyena_mcp --version
```

You should see the `analyze`, `dead-code`, and `complexity` commands. The version commands print `hyena_dart 2.0.0` and `hyena_mcp 2.0.0` respectively.

See [Migrating from v1.x to v2.0](/docs/migrating-to-v2/) before updating an existing installation.
