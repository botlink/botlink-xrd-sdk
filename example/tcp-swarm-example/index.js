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

require('dotenv').config();
const net = require('net');
const { pipeline } = require('stream');

const { auth, XRDApi, XRDSocket } = require('botlink-xrd-sdk');
const { C3, API } = require('botlink-xrd-sdk/dist/src/urls');
const MavlinkMessageTransform = require('./mavlinkMessageTransform');

let server;

console.log(`C3 URL - ${C3}`);
console.log(`API URL - ${API}`);

process.on('warning', e => console.warn(e.stack));

const email = 'myEmail@botlink.com'
const password = 'myPassword'
const xrdsToConnect = [
  { systemId: '1', hardwareId: '7654440a-bb58-11ea-b3de-0242ac130004' },
  { systemId: '2', hardwareId: '765447f2-bb58-11ea-b3de-0242ac130004' }
];

const xrdHardwareIds = xrdsToConnect.map(xrd => xrd.hardwareId);

(async () => {
  try {
    const destroy = (socket) => {
      if (socket) {
        console.log(`[DESTROY] Connection from ${socket.remoteAddress}`);
        socket.removeAllListeners();
        socket.end();
        socket = null;
      }
    };

    const getCredentials = async (email, password) => {
      try {
        console.log(`[INFO] Authenticating with ${API} as ${email}`);
        const credentials = await auth(email, password);
        console.log(`[INFO] Successfully authenticated with ${API} as ${email}`);

        return credentials;
      } catch (error) {
        const unableToAuthenticate = 'Unable to authenticate with botlink services';
        console.error(unableToAuthenticate, error);
        throw new Error(unableToAuthenticate);
      }
    };

    const getXrds = async (credentials, xrdHardwareIds) => {
      let allXRDs;
      try {
        const api = new XRDApi(credentials);
        allXRDs = await api.list();
      } catch (error) {
        const unableToListXRDs = 'Unable to list XRDs';
        console.error(unableToListXRDs, error);
        throw new Error(unableToListXRDs);
      }

      const filteredXRDs = allXRDs.filter(xrd => xrdHardwareIds.indexOf(xrd.hardwareId) >= 0);

      const xrdHardwareIdsRetrieved = filteredXRDs.map(xrd => xrd.hardwareId);
      const missingXRDs = xrdHardwareIds.filter(hardwareId => xrdHardwareIdsRetrieved.indexOf(hardwareId) < 0);

      for (let i = 0; i < missingXRDs.length; i++) {
        console.error(`Unable to find the XRD specified, hardwareId: ${missingXRDs[i]}`);
      }

      if (missingXRDs.length > 0) {
        throw new Error(`Unable to retrieve all XRD's specificed`);
      }

      return filteredXRDs;
    };

    const connectXRDToSocket = async (socket, credentials, systemId, xrd) => {
      return new Promise((resolve, reject) => {
        console.log(`[INFO] Connecting to XRD ${xrd.name || xrd.emei} (${xrd.hardwareId})`);

        const xrdSocket = new XRDSocket({
          xrd,
          credentials
        });

        xrdSocket.on('disconnect', () => {
          console.log(`[INFO] Reconnecting to XRD ${xrd.name || xrd.emei} (${xrd.hardwareId})`);
        });

        xrdSocket.connect(() => {
          const onComplete = (err) => {
            if (err) {
              console.error(err);
            }

            destroy(socket);
          }

          pipeline(socket, new MavlinkMessageTransform(systemId, true), xrdSocket, onComplete);
          pipeline(xrdSocket, new MavlinkMessageTransform(systemId, false), socket, onComplete);

          console.log(`[INFO] Connected to XRD ${xrd.name || xrd.emei} (${xrd.hardwareId})`);
          resolve()
        });
      })
    };

    const credentials = await getCredentials(email, password);
    const xrds = await getXrds(credentials, xrdHardwareIds);

    server = net.createServer(async (socket) => {
      console.log(`[ACCEPT] Connection from ${socket.remoteAddress}`);

      socket.on('close', () => {
        destroy(socket);
      });

      const connectionPromises = []
      for (let i = 0; i < xrds.length; i++) {
        const xrd = xrds[i];
        const { systemId } = xrdsToConnect.find(xrdToConnect => xrdToConnect.hardwareId === xrd.hardwareId)

        connectionPromises.push(connectXRDToSocket(socket, credentials, systemId, xrd));
      }

      await Promise.all(connectionPromises)

      console.log(`All XRD's connected`)
    });

    server.on('error', (err) => {
      console.error('[ERROR] ', error);
      throw err;
    });

    const port = process.env.PORT || 5760
    server.listen(port, () => {
      console.log(`Server listening on ${port}`)
    });
  } catch (error) {
    console.error('[ERROR] ', error);

    if (server) {
      server.close();
    }
  }
})()
