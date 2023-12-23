let express = require('express');

let router = express.Router();

let payloadController = require("./controllers/payloadController");

router.get("/", payloadController.showInfo);

module.exports = router;