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
const { BotlinkApi, XrdConnection, XrdConnectionEvents, XrdConnectionStatus } = require('botlink-xrd-sdk')

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

  const configuredPort = process.env.PORT || 14650;
  const bindAddr = process.env.BINDADDR || '127.0.0.1';
  const writePort = process.env.WRITEPORT || 14550;
  const gcsAddr = process.env.WRITEADDR || "127.0.0.1";

  xrdConnection = new XrdConnection(api, selectedXrd)

  let xrdName = selectedXrd.name || selectedXrd.emei

  xrdConnection.on(XrdConnectionEvents.ConnectionStatus, async (status) => {
    if (status === XrdConnectionStatus.Connected) {
      console.log(`[INFO] Connected to XRD ${xrdName}, (${selectedXrd.hardwareId})`)
      let connected = false
      let connecting = false
      let bindPort = configuredPort

      server.on("error", error => {
        console.error(`UDP socket error: ${error}`);
        if ( error.code === "EADDRINUSE" ) {
          connecting = false
          // try next port if in use; wrap at max
          bindPort = bindPort + 1
          if (bindPort < 1024 || bindPort > 65535) {
              bindPort = 1024
          }
          console.log(`inuse, bumping to ${bindPort}`)
          if ( bindPort === configuredPort ) {
            // give up
            connected = true
            console.error("UDP socket error: EADDRINUSE; could not find available port!");
          }
        }
        else {
          console.error(`UDP socket error: ${error}`);
          server.close();
        }
      });

      // try all ports till binding is possible
      while ( connected === false ) {
        if ( connecting === false ) {
          connecting = true
          console.log(`trying ${bindAddr}:${bindPort}`)
          try {
            server.bind(bindPort, bindAddr, () => {
              console.log(`Listening on UDP ${bindAddr}:${bindPort}. Sending to ${gcsAddr}:${writePort}`);

              server.on("message", (message, rinfo) => {
                connected = true
                console.log("From GCS:", Buffer.from(message).toString("hex"));
                xrdConnection.sendAutopilotMessage(message);
              });

              xrdConnection.on(XrdConnectionEvents.AutopilotMessage, xrdData => {
                console.log("From XRD:", Buffer.from(xrdData).toString("hex"));
                try{
                  server.send(xrdData, writePort, gcsAddr);
                } catch(error) {
                  console.log(`error on autopilot message ${error}`)
                }
              })
            });
          } catch (error) {
            if ( error.code != "ERR_SOCKET_ALREADY_BOUND" ) {
              console.log(`UDP bind exception : "${error}"`)
            }
          }
        }
        else {
          await sleep(5)
        }
      }

    } else if (status === XrdConnectionStatus.Connecting) {
      console.log(`[INFO] Connecting to XRD ${xrdName}, (${selectedXrd.hardwareId})`)
    } else if (status === XrdConnectionStatus.Disconnected) {
      console.log(`[INFO] Disconnected from XRD ${xrdName}, (${selectedXrd.hardwareId})`)
    }
  })

  xrdConnection.openConnection(60)


})().catch(error => {
  console.error("[ERROR] ", error);

  if (server) {
    xrdConnection.closeConnection()
    server.close();
  }
});
