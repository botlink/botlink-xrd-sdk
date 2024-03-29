/**
Copyright 2019 Botlink, LLC.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

require("dotenv").config();
const udp = require("dgram");
const { BotlinkApi, XrdConnection, XrdConnectionEvents, XrdConnectionStatus, XrdVideoConfig } = require('botlink-xrd-sdk')

var server;

const authenticate = async xrd => {
  let botlinkApi = new BotlinkApi()
  try {
    await botlinkApi.login({'username': xrd.email, 'password': xrd.password})
  } catch (error) {
    throw new Error("Unable to authenticate with Botlink services");
    return;
  }

  console.log(
    "[INFO] Successfully authenticated as ",
    xrd.email
  );

  let xrds;

  try {
    xrds = await botlinkApi.listXrds();
  } catch (error) {
    throw new Error("Unable to list XRDs");
  }

  let selectedXrd = xrds.find(thisXrd => {
    return thisXrd.hardwareId === xrd.hardwareId;
  });

  if (!selectedXrd) {
    throw new Error("Unable to find the XRD specified");
  }

  return { botlinkApi, selectedXrd };
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

(async () => {
  const xrd = {
    hardwareId: process.env.RELAY_XRD_HARDWARE_ID,
    email: process.env.RELAY_XRD_EMAIL,
    password: process.env.RELAY_XRD_PASSWORD
  };

  const { botlinkApi: api, selectedXrd } = await authenticate(xrd);

  server = udp.createSocket("udp4");

  const configuredPort = process.env.PORT || 0;
  const bindAddr = process.env.BINDADDR || '127.0.0.1';
  const writePort = process.env.WRITEPORT || 14550;
  const gcsAddr = process.env.WRITEADDR || "127.0.0.1";
  const videoPort = process.env.VIDEOPORT || 5600;
  const videoAddress = process.env.VIDEOADDRESS || "127.0.0.1";
  const videoFrameRate = process.env.FrameRate || 24;
  let videoRes = process.env.VIDEORESOLUTION || "1080";
  let videoCodec = process.env.VIDEOCODEC || "OFF";

  videoRes = videoRes.toUpperCase()
  videoCodec = videoCodec.toUpperCase()

  const videoEnabled = ( ['H265', 'H264'].includes( videoCodec ) && videoPort < 2**16-1 && videoPort > 0 );

  xrdConnection = new XrdConnection(api, selectedXrd)

  let xrdName = selectedXrd.name || selectedXrd.emei
  console.log("Selected XRD", xrdName)

  xrdConnection.on(XrdConnectionEvents.ConnectionStatus, async (status) => {
    if (status === XrdConnectionStatus.Connected) {
      console.log(`[INFO] Connected to XRD ${xrdName}, (${selectedXrd.hardwareId})`)
      let bindPort = configuredPort

      server.on("error", error => {
        console.error(`UDP socket error: ${error}`);
        server.close();
      });

      try {
        server.bind(bindPort, bindAddr, () => {
          const connInfo = server.address()

          console.log(`Listening on UDP ${connInfo.address}:${connInfo.port}. Sending to ${gcsAddr}:${writePort}`);

          server.on("message", (message, rinfo) => {
            connected = true
            // Received MAVLink frame from Ground Station
            // console.log("From GCS:", Buffer.from(message).toString("hex"));
            xrdConnection.sendAutopilotMessage(message);
          });

          xrdConnection.on(XrdConnectionEvents.AutopilotMessage, xrdData => {
            // Received MAVLink from from XRD
            // console.log("From XRD:", Buffer.from(xrdData).toString("hex"));
            try{
              server.send(xrdData, writePort, gcsAddr);
            } catch(error) {
              console.log(`error on autopilot message ${error}`)
            }
          })

          xrdConnection.on(XrdConnectionEvents.VideoConfig, xrdData => {
            console.log("Video Config Changed:", xrdData)
          })
          xrdConnection.pingXrd()
        });
      } catch (error) {
        console.log(`UDP bind exception : "${error}"`)
      }
    } else if (status === XrdConnectionStatus.Connecting) {
      console.log(`[INFO] Connecting to XRD ${xrdName}, (${selectedXrd.hardwareId})`)
    } else if (status === XrdConnectionStatus.Disconnected) {
      console.log(`[INFO] Disconnected from XRD ${xrdName}, (${selectedXrd.hardwareId})`)
    }
  })

  if (xrdConnection.addVideoTrack()){
    const connection = await xrdConnection.openConnection(60)
    if (connection === true && videoEnabled === true){
      //const forwarding = xrdConnection.setVideoForwardPort(Number(videoPort))
      const forwarding = xrdConnection.setVideoForwardPort(Number(videoPort), videoAddress)

      // See https://botlink.github.io/botlink-xrd-sdk/typedoc/interfaces/XrdVideoConfig.html
      // Set state to 'Paused' to pause video, 'Playing' to resume
      // The XRD has a single hardware encoder; pausing will pause for all viewers.
      // Changing framerate or resolution will change for all viewers.
      const videoStarted = xrdConnection.setVideoConfig({
        "codec": videoCodec,
        "framerate": videoFrameRate,
        "resolution": videoRes,
        "state": "Playing"
      })
      if (videoStarted){
        console.log('Video started sucessfully.')
      }
      if (forwarding){
        console.log(`Sending UDP ${videoCodec} stream to ${videoAddress}:${videoPort}`)
      }
    }
  }



})().catch(error => {
  console.error("[ERROR] ", error);

  if (server) {
    xrdConnection.closeConnection()
    server.close();
  }
});
