require("dotenv").config();
const { auth, XRDApi } = require("botlink-xrd-sdk");

const relay = {
  xrd: {
    hardwareId: process.env.RELAY_XRD_HARDWARE_ID,
    email: process.env.RELAY_XRD_EMAIL,
    password: process.env.RELAY_XRD_PASSWORD
  }
};

(async () => {
  const relay = {
    xrd: {
      hardwareId: process.env.RELAY_XRD_HARDWARE_ID,
      email: process.env.RELAY_XRD_EMAIL,
      password: process.env.RELAY_XRD_PASSWORD
    }
  };

  console.log(process.env.RELAY_XRD_PASSWORD);

  let credentials;

  try {
    credentials = await auth(relay.xrd.email, relay.xrd.password);
  } catch (error) {
    console.error("Unable to authenticate with botlink services", error);
    return;
  }

  const api = new XRDApi(credentials);

  let presence = await api.presence();

  presence.forEach(p => {
    console.log(`${p.hardwareId} - ${p.connected}`);
  });

  let healthy = await api.health();

  console.log(`Healthy ${healthy}`);
})().catch(error => {
  console.error(error);
});
