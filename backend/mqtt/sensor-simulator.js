const mqtt = require("mqtt");
const dotenv = require("dotenv");
const config = require("../config/app");
dotenv.config();

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const client = mqtt.connect(config.mqtt.url, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: config.mqtt.username,
  password: config.mqtt.password,
  reconnectPeriod: 1000,
});
client.on("connect", () => {
  console.log("Connected to MQTT broker");
  client.subscribe("13/#");
});
setInterval(() => {
  const client1Sensors = [
    "spg4x",
    "sht40",
    "pressure",
    "bem680",
    "bmm150",
    "tsl2591",
    "scd4x",
    "veml770",
    "shtc3",
    "sht20",
    "sl7021",
    "bmp280",
  ];

  const client2Sensors = [
    "spg4x",
    "sht40",
    "pressure",
    "bem680",
    "bmm150",
    "tsl2591",
    "scd4x",
    "veml770",
  ];

  // Generate and publish data for client1 sensors
  client1Sensors.forEach((sensor) => {
    const data = [
      { type: "t", value: Math.random() * 100 },
      { type: "h", value: Math.random() * 100 },
      { type: "atm", value: Math.random() * 100 },
    ];
    client.publish(`13/client1/${sensor}`, JSON.stringify(data));
  });

  // Generate and publish data for client2 sensors
  client2Sensors.forEach((sensor) => {
    const data = [
      { type: "t", value: Math.random() * 100 },
      { type: "h", value: Math.random() * 100 },
    ];
    client.publish(`13/client2/${sensor}`, JSON.stringify(data));
  });
}, 5000);
setTimeout(() => {
  client.publish(
    "13/client1/pressure",
    JSON.stringify({
      value: Math.random() * 100,
    })
  );
}, 4000);
