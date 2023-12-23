const express = require("express");
const mqtt = require("mqtt");
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const username = "health-tracker@ttn";
const password = "NNSXS.B2HTZ5VEYDZCPLLGPBEODANCROPOIXXXD6K73WA.XDEVF7FLLPQOMYXA5KKAQSWGUUJY7YK2SGOS4JEVNDHENZIN6MSQ";

app.use(express.urlencoded({ extended: true }));

// session
let session = require("express-session");
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Router
let routes = require('./router');
app.use('/', routes);

app.use(express.static('public'));

// Connect to TTN and subscribe to your device
const client = mqtt.connect("mqtt://eu1.cloud.thethings.network:1883", {
  username: username,
  password: password
});

client.on('connect', () => {
  console.log("Connected to TTN");

  let card = "bpm";
  let topic = "v3/" + username + "/devices/" + card + "/up";
  client.subscribe(topic);
  console.log("Subscribed to cardboard");
});

// Data storage for BPM
let bpmData = {
  labels: [],
  values: []
};

// When TTN sends a message, notify the client via socket.io
client.on('message', (topic, message) => {
  console.log("Message !");
  let decoded_message = JSON.parse(message);

  let decoded_payload = decoded_message.uplink_message.decoded_payload;
  console.log(decoded_payload);

  // Extract BPM value from the message
  let bpm = decoded_payload.bpm;

  // Add the current time as a label
  let currentTime = new Date().toLocaleTimeString();
  bpmData.labels.push(currentTime);

  // Add the BPM value to the data
  bpmData.values.push(bpm);

  // Limit the data to a certain number of points (e.g., 10)
  if (bpmData.labels.length > 10) {
    bpmData.labels.shift();
    bpmData.values.shift();
  }

  // Emit the updated bpmData to clients
  io.emit('bpmData', bpmData);
});

const port = 3000;

app.get('/data', (req, res) => {
  // Send the BPM data as JSON to the client
  res.json(bpmData);
});

http.listen(port, function () {
  console.log('Server is running on port 3000');
});
