# Botlink XRD SDK Example App

These apps are a complete working example of using the Botlink XRD SDK
to connect your drone to QGroundControl. There are four examples, two showing TCP
connectivity, and the other two showing UDP connectivity.

## Installation

```bash
yarn
```

## Configuration

Running the example requires configuring a few environment variables.

This example uses dotenv, so you can place these in a .env file in this directory.

| Environment Variable  | Required? | Description                                                                         |
| --------------------- | --------- | ------------------------------------------------------------------------------------|
| RELAY_XRD_EMAIL       | **yes**   | The email address of the owner of the XRD                                           |
| RELAY_XRD_PASSWORD    | **yes**   | The password of the owner of the XRD                                                |
| RELAY_XRD_HARDWARE_ID | **yes**   | The hardware ID of the XRD (with dashes)                                            |
| PORT                  | no        | The port used to listen for GCS Connections. Defaults to tcp 5760 or UDP 0 (random) |
| BINDADDR              | no        | The IP address to listen on. Defaults to 127.0.0.1. Use 0.0.0.0 for "all" addresses |
| WRITEPORT             | no        | The port used to send messages to GCS. UDP Only. Defaults to 14550                  |
| WRITEADDR             | no        | The IP address of the GCS. UDP Only. Defaults to 127.0.0.1                          |
| VIDEOADDRESS          | no        | The IP address of the Video Receiver. UDP Only. Defaults to 127.0.0.1               |
| VIDEOPORT             | no        | The UDP Port of the Video Receiver. UDP Only. Defaults to 5600.                     |
| VIDEORESOLUTION       | no        | Resolution from XRD. Defaults '1080'. Options: '4K', '720', '480', etc. See below.  |
| VIDEOFRAMERATE        | no        | FrameRate (Frames per Second) from XRD: Defaults 24. See Below.                     |
| VIDEOCODEC            | **video** | Video Codec from XRD: 'H264' or 'H265'. Defaults 'OFF'. H265 recommended.           |

Video encoding settings (codec, framerate, resolution) affect how the XRD encodes the video stream and transmits it to
the SDK. Lower resolution, lower framerate, and H265 instead of H264 will all result in less cellular data usage.

All other settings describe how the SDK communicates with a Ground Station or Video Player.

## Running

### To run the TCP example (index.js)
Uses NextGen datalink (WebRTC). Communication between SDK and Drone will be over WebRTC (UDP).
Connection from SDK to Ground Station software will be over TCP.

```bash
yarn start
```

### To run the TCP example for Classic datalink (index-classic.js)
Uses Classic datalink (WebSockets). Communication between SDK and Drone will be over WebRTC (UDP).
Connection from SDK to Ground Station software will be over TCP.

```bash
yarn start-classic
```

### To run the UDP example (index-udp.js)
Uses NextGen datalink (WebRTC). Communication between SDK and Drone will be over WebRTC (UDP).
Connection from SDK to Ground Station software will be over UDP.

Should auto connect to most GCS software on localhost.
If `WRITEADDR` is an external system, be sure to set `BINDADDR` to an address `0.0.0.0` or the
adapter address on the GCS's network.

```bash
yarn start-udp
```

#### Video Settings

The UDP example includes support for sending a UDP stream to a video receiver, such as QGroundControl. To enable,
set `VIDEOCODEC=H265` in the environment. This will configure an 1080p, H265 video encoding on the XRD and forward
the video to UDP `127.0.0.1:5600`

**Optional**

* Customize Codec, Resolution, Receiver IP, Recevier UDP port, and Framerate
* Available Framerates: 60, 30, 24, 15, 10, 5, 1.
* See [Resolution Options](https://botlink.github.io/botlink-xrd-sdk/typedoc/enums/XrdVideoResolution.html) for full list of resolutions.

### To run the UDP example and connect to multiple XRDs (index-udp-multi.js)
Uses NextGen datalink (WebRTC)

This example assumes each drone has a unique MAVLink system ID and all drones are operated by the same GCS
`WRITEADDR` and `WRITEPORT` are used to connect to the GCS. See above.
If PORT is not 0, each drone will have a consecutive listen port starting at PORT

If RELAY_XRD_HARDWARE_ID is defined, treat as comma separated list of XRDs to connect to; else try all XRDs on the account

If `WRITEADDR` is an external system, be sure to set `BINDADDR` to an address on the GCS's network.

```bash
yarn start-udp:multi
```

### To run the presence & health example (presence.js)

```bash
yarn start-presence
```
