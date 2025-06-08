const express = require('express');
const router = express.Router();
const audienceController = require('../../controllers/v1/audience.controller');

router.get('/audiences', audienceController.listAudiences);

module.exports = router; 