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

| Environment Variable  | Required? | Description                                                                   |
| --------------------- | --------- | ----------------------------------------------------------------------------- |
| RELAY_XRD_EMAIL       | **yes**   | The email address of the owner of the XRD                                     |
| RELAY_XRD_PASSWORD    | **yes**   | The password of the owner of the XRD                                          |
| RELAY_XRD_HARDWARE_ID | **yes**   | The hardware ID of the XRD (no dashes)                                        |
| PORT                  | no        | The port used to listen for connections from QGroundControl. Defaults to 8080 |

## Running

### To run the TCP example

```bash
yarn start
```

### To run the UDP example

```bash
yarn start-udp
```
