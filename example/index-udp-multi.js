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
const udp = require("dgram");
const { XRDSocket, BotlinkApi, XrdConnection, XrdLogger } = require('botlink-xrd-sdk')

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

  return { botlinkApi, xrds };
};

(async () => {
  const creds = {
    email: process.env.RELAY_XRD_EMAIL,
    password: process.env.RELAY_XRD_PASSWORD
  };

  const { botlinkApi: api, xrds } = await authenticate(creds);

  let portOffset = 0;
  const basePort = process.env.PORT || 14650;
  const bindAddr = process.env.BINDADDR || '127.0.0.1';
  const gcsPort = process.env.WRITEPORT || 14550;
  const gcsAddr = process.env.WRITEADDR || "127.0.0.1";

  const refreshToken = await api.getRefreshToken()
  const accessToken = await api.getAuthToken()

  for (let i=0; i<xrds.length; i += 1) {
    const server = udp.createSocket("udp4");
    const port = basePort + portOffset;

    const xrd = xrds[i]

    portOffset += 1;

    const xrdSocket = new XRDSocket({
      xrd,
      credentials: {
          token: accessToken,
          refresh: refreshToken,
          user: { id: -1 }
      }
    });

    xrdSocket.on("error", error => {
      console.error(error);
      xrdSocket.close();
      server.close();
    });

    xrdSocket.on("data", message => {
      console.log(`From XRD${i}: ${Buffer.from(message).toString("hex")}`);
      server.send(message, gcsPort, gcsAddr);
    });

    server.on("error", error => {
      console.error(error);
      xrdSocket.close();
      server.close();
    });

    xrdSocket.connect(() => {
      server.bind(port, bindAddr, () => {
        console.log(`Listening on UDP ${bindAddr}:${port}, writing to UDP ${gcsAddr}:${gcsPort}`);

        server.on("message", (message, rinfo) => {
          console.log("From GCS:", Buffer.from(message).toString("hex"));
          xrdSocket.write(message);
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
