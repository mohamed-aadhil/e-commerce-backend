const http = require('http');
const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const webSocketService = require('./services/websocket.service');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service with the HTTP server
webSocketService.initialize(server);

// Make io instance available in app for routes
app.set('io', webSocketService.io);

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to the database');
      process.exit(1);
    }
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📚 Connected to database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.log(`🔌 WebSocket server initialized`);
      console.log(`📊 WebSocket monitoring available at http://localhost:${PORT}/api/v1/websocket/analytics-room`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Start the application
startServer();