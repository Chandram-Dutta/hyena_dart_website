---
title: Dead-code analysis
description: Understand Hyena's declaration graph, reachability roots, export handling, and current limits.
---

The dead-code analyzer resolves Dart syntax to analyzer elements, records declarations and references, and reports declarations that are not reachable from any root.

## Analysis flow

1. Recursively collect `*.dart` files under the target.
2. Apply custom and built-in exclusions.
3. Resolve every included compilation unit with the official Dart analyzer.
4. Record declarations and their stable analyzer element IDs.
5. Record references as edges from the declaration that contains each reference.
6. Establish roots such as `main`, overrides, top-level references, and configured exports.
7. Traverse the graph from all roots.
8. Report declarations not in the reachable set.

If any included file cannot be resolved or contains an analyzer error, the analysis stops and lists the failures. Run `dart pub get` in the target package before analysis.

## Recorded declarations

| Category | Details |
| --- | --- |
| Types | Classes, abstract classes, mixins, named extensions, extension types, enums |
| Executables | Top-level functions, methods, getters, setters |
| Data | Top-level variables, fields, enum values |
| Aliases | Function type aliases and generic type aliases |

Constructors are used in reference tracking but are not emitted as standalone dead-code findings. Anonymous extensions do not have their own declaration entry. Methods annotated `@override` are not candidates because external framework or interface dispatch can call them.

## Reachability roots

References outside a recorded declaration are roots. Hyena also roots:

- the top-level `main` function;
- methods annotated `@override`;
- exported declarations when `ignore_exports` is enabled;
- private declarations when `ignore_private` is enabled.

References inside a root or another reachable declaration make their target declarations reachable. This avoids treating a helper as used merely because another unreachable helper calls it.

When an analyzer element is unavailable, Hyena falls back to matching simple and qualified names. Element-based references are the primary path.

## Export handling

With the default `ignore_exports: true`, Hyena identifies public top-level declarations exposed by direct `export` directives among the scanned units. It honors `show` and `hide` combinators.

An exported container also protects its public members and public constructors as roots. Private members remain candidates unless `ignore_private` is also enabled.

```dart title="lib/package.dart"
export 'src/client.dart' show Client;
```

`Client` and its public surface are treated conservatively as externally reachable.

:::caution[Current export boundary]
Export discovery is direct rather than a transitive public-API closure. It resolves relative and `package:` URIs using `.dart_tool/package_config.json`, and only recognizes exported files included in the current scan.
:::

Use `--no-ignore-exports` to include exported declarations as candidates:

```shell
hyena_dart dead-code lib --no-ignore-exports
```

## Private and main declarations

`ignore_private` defaults to `false`, so unused private declarations are reported. Enable it when private hooks are invoked indirectly by tooling or conventions:

```shell
hyena_dart dead-code lib --ignore-private
```

`ignore_main` defaults to `true` and is only configurable in YAML. It omits `main` from the declaration count and candidate set. `main` remains a graph root either way.

## Interpreting findings

Treat a finding as a static reachability claim within the scanned and resolved source, not proof that deletion is always safe. Review code reached through:

- reflection or string-based registration;
- generated source that Hyena excludes;
- native bindings, build scripts, or framework conventions;
- consumers outside the scanned package;
- indirect export chains not represented in the scan.

Prefer a narrow exclusion or an export/private policy change only when the indirect entry mechanism is intentional and understood.
