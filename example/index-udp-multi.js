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
const udp = require("dgram");
const { BotlinkApi, XrdConnection, XrdConnectionEvents, XrdConnectionStatus } = require('botlink-xrd-sdk')

const authenticate = async (user, xrdFilterList) => {
  let botlinkApi = new BotlinkApi()
  try {
    await botlinkApi.login({'username': user.email, 'password': user.password})
  } catch (error) {
    throw new Error("Unable to authenticate with Botlink services");
    return;
  }

  console.log( `[INFO] Successfully authenticated as ${user.email}`);

  let xrds;

  try {
    xrds = await botlinkApi.listXrds();
  } catch (error) {
    throw new Error("Unable to list XRDs");
  }

  let selectedXrds = xrds.filter( x => xrdFilterList?.includes(x.hardwareId) )

  console.log( `[INFO] Found ${selectedXrds.length} (${xrds.length}) xrds`);
  return { botlinkApi, xrds: (( xrdFilterList ) ? selectedXrds : xrds) };
};

(async () => {
  const creds = {
    email: process.env.RELAY_XRD_EMAIL,
    password: process.env.RELAY_XRD_PASSWORD
  };

  const xrdFilter = process.env.RELAY_XRD_HARDWARE_ID
  const xrdFilterList = xrdFilter?.split(',').map( e => e.trim() )

  const { botlinkApi: api, xrds } = await authenticate(creds, xrdFilterList)

  const basePort = process.env.PORT || 0;
  const bindAddr = process.env.BINDADDR || '127.0.0.1';
  const gcsPort = process.env.WRITEPORT || 14550;
  const gcsAddr = process.env.WRITEADDR || "127.0.0.1";

  for (let i=0; i<xrds.length; i += 1) {
    const server = udp.createSocket("udp4");
    const bindPort = (basePort == 0) ? 0 : basePort + i;

    const xrd = xrds[i]

    let xrdConnection = new XrdConnection(api, xrd)
    let xrdName = xrd.name || xrd.emei

    xrdConnection.on(XrdConnectionEvents.ConnectionStatus, async (status) => {
      console.log(`[INFO] ${status} to XRD${i} ${xrdName}, (${xrd.hardwareId}) as NextGen`)
      if (status === XrdConnectionStatus.Connected) {
        server.on("error", error => {
          console.error(`[ERROR] XRD${i} ${error}`);
          xrdConnection.close();
          server.close();
        });

        try {
          server.bind(bindPort, bindAddr, () => {
            const connInfo = server.address()

            console.log(`[INFO] XRD${i} ${xrd.hardwareId} listening on UDP ${connInfo.address}:${connInfo.port}. Sending to ${gcsAddr}:${gcsPort}`);

            server.on("message", (message, rinfo) => {
              console.log(`From GCS to XRD${i}: ${Buffer.from(message).toString("hex")}`);
              xrdConnection.sendAutopilotMessage(message);
            });
          });

          xrdConnection.on(XrdConnectionEvents.AutopilotMessage, xrdData => {
            console.log(`From XRD${i}: ${Buffer.from(xrdData).toString("hex")}`);
            try{
              server.send(xrdData, gcsPort, gcsAddr);
            } catch(error) {
              console.log(`error on autopilot message ${error}`)
            }
          });
        } catch (error) {
          console.log(`UDP bind exception : "${error}"`)
        }
      }
    });

    xrdConnection.openConnection(20)
  }
})().catch(error => {
  console.error("[ERROR] ", error);
});
