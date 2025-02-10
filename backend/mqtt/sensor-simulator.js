const mqtt = require("mqtt");
const dotenv = require("dotenv");
dotenv.config();
``;
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_SECRET_KEY,
  reconnectPeriod: 1000,
});
client.on("connect", () => {
  console.log("Connected to MQTT broker");
  client.subscribe("11/#");
});
setInterval(() => {
  // Create sensor data objects with proper formatting
  const temperature = {
    value: Math.random() * 100,
  };

  const humidity = {
    value: Math.random() * 100,
  };

  const pressure = {
    value: Math.random() * 100,
  };

  // Convert objects to JSON strings before publishing
  client.publish("11/client1/temperature", JSON.stringify(temperature));
  client.publish("11/client1/humidity", JSON.stringify(humidity));
  client.publish("11/client2/pressure", JSON.stringify(pressure));
}, 4000);
setTimeout(() => {
  client.publish(
    "11/client3/pressure",
    JSON.stringify({
      value: Math.random() * 100,
    })
  );
}, 4000);
