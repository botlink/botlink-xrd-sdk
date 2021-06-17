# botlink-xrd-sdk

SDK for consuming Botlink XRD (eXtended Range Datalink) services for drones.

## Installation

This package is not currently published to the NPM registry, so you'll need to add it to your
project using a slightly different syntax than normal.

```bash
yarn add git+https://github.com/botlink/botlink-xrd-sdk.git#semver:^0.1.0
```

or

```bash
npm install --save git+https://github.com/botlink/botlink-xrd-sdk.git#semver:^0.1.0
```

## Building

This package contains TypeScript code that needs to be compiled and C++ code which may or may not need to be compiled.

The following directions assume [yarn](https://yarnpkg.com/) is installed.

### C++
This package uses a Node.js native addon written in C++ to provide bindings to the [Botlink C++ Client Library](https://botlink.github.io/botlink-xrd-sdk/doxygen/index.html) that is included in the Botlink C++ SDK.

If using a tagged version of this package, a prebuilt release of the C++ code may be available. To download the prebuilt release, simply run the command `yarn`.

If a prebuilt release is not available, `yarn` falls back to compiling the C++ code. See the next section.

#### Build with a release of the Botlink C++ SDK
If a prebuilt release is not available, when `yarn` runs, `yarn` instead downloads a release of the Botlink C++ SDK (if available), and then builds the C++ Node.js bindings using [node-gyp](https://github.com/nodejs/node-gyp). Please refer to the node-gyp page for dependencies required to build C++ code.

If a release of the Botlink C++ SDK is not available for your platform and/or architecture, then building the C++ Node.js bindings is not possible.

#### Build with a local copy of the Botlink C++ SDK
If you already have a local copy of the Botlink C++ SDK and desire to use this SDK, set the environment variable `BOTLINKSDK_DIR` to the location of the SDK and then run `yarn`. When the `BOTLINKSDK_DIR` environment variable is set, `yarn` skips trying to download a release of the Botlink C++ SDK and uses the SDK pointed to by `BOTLINKSDK_DIR` instead.

#### Force recompilation
If you desire to force recompilation of the C++ bindings (e.g., you do not want to use a prebuilt release of the C++ bindings), run `yarn rebuild-bindings`.

#### Publishing a build
To publish a build of the C++ bindings, follow the directions in the [S3 Hosting](https://github.com/mapbox/node-pre-gyp#s3-hosting) section of the [node-pre-gyp](https://github.com/mapbox/node-pre-gyp#readme) readme.

### TypeScript

Run `yarn build` to compile the TypeScript. The resulting JavaScript code is found in `dist/`.

## Usage

See `src/napi/lib/binding.ts` for the TypeScript API.

[TypeDoc](https://typedoc.org/) API documentation can be viewed at https://botlink.github.io/botlink-xrd-sdk/typedoc/index.html.

To use botlink-xrd-sdk in a TypeScript project, import `src/napi/lib/binding.ts`. To use in a JavaScript project, build compile the TypeScript code as described above, and import `dist/src/napi/lib/binding.js`.

## TypeDoc

The SDK includes [TypeDoc](https://typedoc.org/) documentation.

### Building

To build the TypeDoc documentation, run `yarn build-typedoc`. Note that this
deletes the `dist/` folder as for some reason TypeDoc does not like to run if
`dist/` exists. The resulting TypeDoc documentation is in `docs/`. It can be
viewed by opening `docs/index.html` in a web browser.

### Updating TypeDoc on GitHub Pages

To update the TypeDoc documentation hosted at https://botlink.github.io/botlink-xrd-sdk do the following:

1. Follow the steps under "Building"
1. Make sure the `botlink-xrd-sdk-gh-pages` submodule is up to date
   * `git submodule update --init --recursive`
   * `cd botlink-xrd-sdk-gh-pages`
   * `git fetch`
   * `git checkout -b gh-pages origin/gh-pages` or `git merge --ff-only origin/gh-pages` if a local branch already exists and is checked out
1. Update the TypeDoc documentation in `botlink-xrd-sdk-gh-pages`
   * `cd botlink-xrd-sdk-gh-pages`
   * `git rm -r typedoc`
   * `mv ../docs ./typedoc`
   * `git add typedoc`
   * `git commit` and write an appropriate commit message
   * `git push origin gh-pages`
1. The changes to the TypeDoc hosted at https://botlink.github.io/botlink-xrd-sdk should be visible now
