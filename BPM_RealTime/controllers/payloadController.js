const socketio = require("socket.io");

let socket = socketio();

let Payload = require("../models/payload");

const columns = [
    'Type de données',
    'Valeur'
];

const dataTypes = [
    "bpm",
    "long",
    "latt",
    "alt"
];

let payload = new Payload(0);

// socket.on('event-name', (data) => {
//     // Update the DOM
//     payload.bpm = data.bpm;
// });

exports.showInfo = function(req, res) {
    socket.on('data', (data) => {
        // Update the DOM
        payload.bpm = data.bpm;
        socket.emit('chartUpdate', payload.toDict());
    });

    res.render('home.ejs', {data: payload, columns: columns, dataTypes: dataTypes});
}