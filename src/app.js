const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');
const sessionStore = require('./config/session-store');
const webSocketService = require('./services/websocket.service');

// Import WebSocket routes
const websocketRoutes = require('./routes/v1/websocket.routes');

// Swagger UI setup
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(__dirname + '/docs/openapi.yaml');

dotenv.config();

console.log('Environment:', process.env.NODE_ENV || 'development');

// Session configuration
const isProduction = process.env.NODE_ENV === 'production';
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: true, // Changed to true to track guest sessions
  store: sessionStore,
  proxy: true, // Trust the reverse proxy
  cookie: {
    secure: isProduction, // Set to true in production, false in development
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    domain: isProduction ? '.yourapp.com' : 'localhost' // Adjust domain for production
  },
  name: 'ecommerce.sid',
  rolling: true, // Reset cookie maxAge on every request
  unset: 'destroy' // Destroy the session when unset
};

// Trust first proxy
app.set('trust proxy', 1);

// Enable CORS with credentials
const corsOptions = {
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-HTTP-Method-Override', 'Accept', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['set-cookie', 'authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS before session middleware
app.use(cors(corsOptions));

// Debug middleware to log session info
app.use((req, res, next) => {
  console.log('--- New Request ---');
  console.log('Cookies:', req.headers.cookie);
  next();
});

// Apply session middleware
app.use(session(sessionConfig));

// Debug middleware after session is initialized
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  next();
});

// Cache control for API routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Test route to verify sessions
app.get('/api/session-test', (req, res) => {
  // Initialize view count if it doesn't exist
  if (!req.session.views) {
    req.session.views = 0;
  }
  
  // Increment view count
  req.session.views++;
  
  // Log session info
  console.log('Session in test endpoint:', {
    sessionId: req.sessionID,
    views: req.session.views,
    cookie: req.session.cookie
  });
  
  // Send response
  res.json({
    sessionId: req.sessionID,
    views: req.session.views,
    cookie: req.session.cookie
  });
});

// API routes
app.use('/api', routes);

// WebSocket monitoring routes
app.use('/api/v1/websocket', websocketRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error handling middleware
app.use(errorHandler);

module.exports = app;