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
const net = require("net");
const fs = require("fs");
const udp = require("dgram");
const { auth, XRDApi, XRDSocket } = require("botlink-xrd-sdk");
const { C3, API } = require("botlink-xrd-sdk/dist/src/urls");

var client;
var server;

console.log(`C3 URL - ${C3}`);
console.log(`API URL - ${API}`);

const authenticate = async relay => {
  let credentials;

  try {
    credentials = await auth(relay.xrd.email, relay.xrd.password);
  } catch (error) {
    throw new Error("Unable to authenticate with Botlink services");
    return;
  }

  console.log(
    "[INFO] Successfully authenticated with ",
    API,
    " as ",
    relay.xrd.email
  );

  const api = new XRDApi(credentials);

  let xrds;

  try {
    xrds = await api.list();
  } catch (error) {
    throw new Error("Unable to list XRDs");
  }

  let selectedXrd = xrds.find(xrd => {
    return xrd.hardwareId === relay.xrd.hardwareId;
  });

  if (!selectedXrd) {
    throw new Error("Unable to find the XRD specified");
  }

  return { credentials, selectedXrd };
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

(async () => {
  const relay = {
    xrd: {
      hardwareId: process.env.RELAY_XRD_HARDWARE_ID,
      email: process.env.RELAY_XRD_EMAIL,
      password: process.env.RELAY_XRD_PASSWORD
    }
  };

  const { credentials, selectedXrd: xrd } = await authenticate(relay);

  server = udp.createSocket("udp4");

  const configuredPort = process.env.PORT || 14650;
  const bindAddr = process.env.BINDADDR || '127.0.0.1';
  const writePort = process.env.WRITEPORT || 14550;
  const gcsAddr = process.env.WRITEADDR || "127.0.0.1";

  const xrdSocket = new XRDSocket({
    xrd,
    credentials
  });

  xrdSocket.on("error", error => {
    console.error(error);
    xrdSocket.close();
    server.close();
  });

  xrdSocket.on("data", message => {
    console.log("From XRD:", Buffer.from(message).toString("hex"));
    server.send(message, writePort, gcsAddr);
  });

  xrdSocket.connect( async () => {
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
          xrdSocket.close()
          console.error("UDP socket error: EADDRINUSE; could not find available port!");
        }
      }
      else {
        console.error(`UDP socket error: ${error}`);
        xrdSocket.close();
        server.close();
      }
    });

    // try all ports till binding is possible
    while ( connected === false ) {
      if ( connecting === false ) {
        console.log(`server: ${Object.keys(server)}`)
        connecting = true
        console.log(`trying ${bindAddr}:${bindPort}`)
        try {
          server.bind(bindPort, bindAddr, () => {
            console.log(`Listening on UDP ${bindAddr}:${bindPort}. Sending to ${gcsAddr}:${writePort}`);

            server.on("message", (message, rinfo) => {
              connected = true
              console.log("From GCS:", Buffer.from(message).toString("hex"));
              xrdSocket.write(message);
            });
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
  });
})().catch(error => {
  console.error("[ERROR] ", error);

  if (server) {
    server.close();
  }
});
