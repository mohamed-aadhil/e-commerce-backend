const express = require('express');
const router = express.Router();
const genreController = require('../../controllers/v1/genre.controller');

router.get('/genres', genreController.listGenres);

module.exports = router; 