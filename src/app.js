const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');
const sequelize = require('./config/database');

// Swagger UI setup
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(__dirname + '/docs/openapi.yaml');

dotenv.config();

app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

// Serve Swagger UI at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: error.message });
  }
});

app.use(errorHandler);

module.exports = app; 