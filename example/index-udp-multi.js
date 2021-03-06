/**
Copyright 2020 Botlink, LLC.

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

  if (!xrds) {
    throw new Error(
      "Unable to find any XRDs registered to this account specified"
    );
  }

  return { credentials, xrds };
};

(async () => {
  const relay = {
    xrd: {
      email: process.env.RELAY_XRD_EMAIL,
      password: process.env.RELAY_XRD_PASSWORD
    }
  };

  const { credentials, xrds } = await authenticate(relay);

  let portOffset = 0;
  const basePort = process.env.PORT || 8080;

  for (let xrd of xrds) {
    const server = udp.createSocket("udp4");

    const port = basePort + portOffset;
    const writePort = port + 1;

    portOffset += 2;

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
      server.send(message, writePort);
    });

    xrdSocket.connect(() => {
      server.bind(port, () => {
        console.log(`Listening on port ${port}, writing to port ${writePort}`);

        server.on("message", (message, rinfo) => {
          console.log("From GCS:", Buffer.from(message).toString("hex"));
          xrdSocket.write(message);
        });

        server.on("error", error => {
          console.error(error);
          xrdSocket.close();
          server.close();
        });
      });
    });
  }
})().catch(error => {
  console.error("[ERROR] ", error);

  if (server) {
    server.close();
  }
});
