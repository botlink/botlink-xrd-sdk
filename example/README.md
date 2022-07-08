# Botlink XRD SDK Example App

These apps are a complete working example of using the Botlink XRD SDK
to connect your drone to QGroundControl. There are two examples, one showing TCP
connectivity, and the other showing UDP connectivity.

## Installation

```bash
yarn
```

## Configuration

Running the example requires configuring a few environment variables.

This example uses dotenv, so you can place these in a .env file in this directory.

| Environment Variable  | Required? | Description                                                                       |
| --------------------- | --------- | --------------------------------------------------------------------------------- |
| RELAY_XRD_EMAIL       | **yes**   | The email address of the owner of the XRD                                         |
| RELAY_XRD_PASSWORD    | **yes**   | The password of the owner of the XRD                                              |
| RELAY_XRD_HARDWARE_ID | **yes**   | The hardware ID of the XRD (with dashes)                                          |
| PORT                  | no        | The port used to listen for GCS Connections. Defaults to tcp 5760 or udp 14650    |
| BINDADDR              | no        | The IP address of the GCS. Defaults to 127.0.0.1. Use 0.0.0.0 for "all" addresses |
| WRITEPORT             | no        | The port used to send messages to GCS. UDP Only. Defaults to 14550                |
| WRITEADDR             | no        | The IP address of the GCS. UDP Only. Defaults to 127.0.0.1                        |

## Running

### To run the TCP example (index.js)

```bash
yarn start
```

### To run the UDP example (index-udp.js)

Should auto connect to most GCS software on localhost.
If `WRITEADDR` is an external system, be sure to set `BINDADDR` to an address on the GCS's network.

```bash
yarn start-udp
```

### To run the UDP example and connect to multiple XRDs (index-udp-multi.js)

This example assumes each drone has a unique MAVLink system ID and all drones are operated by the same GCS
`WRITEADDR` and `WRITEPORT` are used to connect to the GCS. See above.
Each drone will have a unique listen port starting at 14650. PORT is ignored

If `WRITEADDR` is an external system, be sure to set `BINDADDR` to an address on the GCS's network.

```bash
yarn start-udp:multi
```

### To run the presence & health example (presence.js)

```bash
yarn start-presence
```
