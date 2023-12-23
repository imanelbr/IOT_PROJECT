const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");
const express = require("express");
const app = express();

app.set('view engine', 'ejs');

const topicBPM = "sensor/bpm";
const topicGPS = "sensor/gps";

let bpmData = [];
let gpsData = [];
let speedData = [];
let altitudeData = [];

// Ajoutez les fonctions de calcul de distance et de vitesse ici
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Rayon de la Terre en mètres
    const phi1 = toRadians(lat1);
    const phi2 = toRadians(lat2);
    const deltaPhi = toRadians(lat2 - lat1);
    const deltaLambda = toRadians(lon2 - lon1);

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
}

function calculateSpeed(distance, timeSec) {
    return distance / timeSec; // Vitesse en mètres par seconde
}

client.on('message', (topic, message) => {
    if (topic === topicBPM) {
        bpmData.push(parseInt(message, 10));
    } else if (topic === topicGPS) {
        const newGPSData = JSON.parse(message);
        gpsData.push(newGPSData);
        altitudeData.push(newGPSData.altitude); // Stocker l'altitude
        if (gpsData.length > 1) {
            const prevGPSData = gpsData[gpsData.length - 2];
            const distance = calculateDistance(prevGPSData.latitude, prevGPSData.longitude, newGPSData.latitude, newGPSData.longitude);
            const speed = calculateSpeed(distance, 5); // 5 secondes entre les mesures
            speedData.push(speed);
        }
    }
});

client.on('connect', () => {
    client.subscribe(topicBPM);
    client.subscribe(topicGPS);
});

app.get('/data', (req, res) => {
    res.json({ bpmData, gpsData, speedData, altitudeData });
});

app.get('/', (req, res) => {
    res.render('index');
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
