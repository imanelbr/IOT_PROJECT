const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

const topicBPM = "sensor/bpm";
const topicGPS = "sensor/gps";

function generateBPMData() {
    // Simuler un BPM entre 60 et 100
    return Math.floor(Math.random() * (100 - 60 + 1)) + 60;
}

let lastLatitude = 50.8503;  // Latitude de départ approximative à Bruxelles
let lastLongitude = 4.3517;  // Longitude de départ approximative à Bruxelles

function generateGPSData() {
    // Simuler un petit changement de position pour un coureur
    // Disons que chaque pas change la position de 0.0001 degrés en latitude/longitude
    const latitudeChange = (Math.random() - 0.5) * 0.0002; // Changement de latitude
    const longitudeChange = (Math.random() - 0.5) * 0.0002; // Changement de longitude

    const latitude = (lastLatitude + latitudeChange).toFixed(5);
    const longitude = (lastLongitude + longitudeChange).toFixed(5);

    // Mise à jour des dernières coordonnées pour la prochaine itération
    lastLatitude = parseFloat(latitude);
    lastLongitude = parseFloat(longitude);

    const altitude = Math.floor(Math.random() * (93 - 55 + 1)) + 55; 
    return { latitude, longitude, altitude };
}

client.on('connect', () => {
    setInterval(() => {
        const bpmData = generateBPMData();
        const gpsData = generateGPSData();

        client.publish(topicBPM, bpmData.toString());
        client.publish(topicGPS, JSON.stringify(gpsData));

        console.log(`BPM Data: ${bpmData}, GPS Data: ${JSON.stringify(gpsData)}`);

    }, 5000); // Envoyer des données toutes les 5 secondes
});
