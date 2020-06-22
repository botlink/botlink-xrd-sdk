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

## Usage

This package exposes 3 components for interacting with Botlink's XRD services --
`auth`, `XRDApi`, and `XRDSocket`.

### auth

The `auth` component allows you to retrieve service tokens for use with the
[XRDApi](#xrdapi) and [XRDSocket](#xrdsocket) components.

```js
const { auth } = require("botlink-xrd-sdk");

let credentials = await auth({
  email: "mail@example.com",
  password: "your-password"
});
```

The returned credentials are meant to be passed to the constructors for [XRDApi](#xrdapi) and
[XRDSocket](#xrdsocket). You shouldn't need to use the contents directly.

### XRDApi

The `XRDApi` component allows you to retrieve information about the Botlink XRDs registered to your
account.

There are currently 3 methods, `list()`, `presence()`, and `health()`.

#### list()

`list()` returns a list of all the XRDs registered to your account.

```js
const { auth, XRDApi } = require("botlink-xrd-sdk");

let credentials = await auth({
  email: "mail@example.com",
  password: "your-password"
});

let api = new XRDApi(credentials);

let xrds = await api.list();

xrds.forEach(xrd => {
  console.log(xrd);
});
```

Each object in the array returned by the `list()` method has the following structure

```json
{
  "id": 0,
  "hardwareId": "",
  "name": ""
}
```

#### presence()

`presence()` returns whether each individual XRD registered to your account is online & connected
to the Botlink cloud.

```js
const { auth, XRDApi } = require("botlink-xrd-sdk");

let credentials = await auth({
  email: "mail@example.com",
  password: "your-password"
});

let api = new XRDApi(credentials);

let xrds = await api.presence();

xrds.forEach(xrd => {
  console.log(xrd);
});
```

Each object in the array returned by the `presence()` method has the following structure

```json
{
  "id": 0,
  "hardwareId": "",
  "connected": false
}
```

#### health()

`health()` returns the status of the Botlink C3 service.

```js
const { auth, XRDApi } = require("botlink-xrd-sdk");

let credentials = await auth({
  email: "mail@example.com",
  password: "your-password"
});

let api = new XRDApi(credentials);

let healthy = await api.health();

console.log(healthy); // True if health, false otherwise
```

### XRDSocket

The `XRDSocket` component allows you to establish a connection to a Botlink XRD using an object-mode
[Duplex Stream](https://nodejs.org/api/stream.html#stream_class_stream_duplex) interface.

The `XRDSocket` expects to receive a exactly one MAVLink packet per write,
and emits exactly one MAVLink packet per read. This behavior matches how QGroundControl
and other commercial ground control stations operate, which means that it is generally safe to
`pipe()` the `XRDSocket` to another stream.

> Note: The data emitted by the `XRDSocket` includes all bytes in the MAVLink packet, not just the payload bytes

The `XRDSocket` has one method - `connect()` - which is not provided by the standard Duplex stream interface.
`connect()` sets up the remote connection to the XRD. Data will not be sent or received from the `XRDSocket` until
the `connect()` method has been called.

```js
const net = require("net");
const { auth, XRDApi, XRDSocket } = require("botlink-xrd-sdk");

let credentials = await auth({
  email: "mail@example.com",
  password: "your-password"
});

let api = new XRDApi(credentials);

let xrds = await api.list();

let xrd = xrds[0];

let xrdSocket = new XRDSocket({ xrd, credentials });
let gcsSocket = net.createConnection(8080, "locahost");

gcsSocket.pipe(xrdSocket);
xrdSocket.pipe(gcsSocket);

xrdSocket.on("connect", () => {
  // Pipe, setup `data` handlers, etc.
  console.log("connected to xrd");
});

xrdSocket.connect();
```
