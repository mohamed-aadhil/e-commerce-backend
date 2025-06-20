const { Server } = require('socket.io');

class WebSocketService {
  constructor() {
    this.io = null;
    this.clients = new Set();
  }

  initialize(server) {
    // Create Socket.IO server with CORS configuration
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:4200', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      // Enable HTTP long-polling as fallback
      transports: ['websocket', 'polling']
    });

    // Handle new connections
    this.io.on('connection', (socket) => {
      console.log(`New client connected: ${socket.id}`);
      this.clients.add(socket.id);

      // Handle joining analytics room
      socket.on('join-analytics', () => {
        socket.join('analytics');
        console.log(`Client ${socket.id} joined analytics room`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.clients.delete(socket.id);
      });
    });

    console.log('WebSocket service initialized');
  }

  // Method to broadcast genre updates to all clients in the analytics room
  broadcastGenreUpdate(genreData) {
    if (this.io) {
      this.io.to('analytics').emit('genre-data-updated', genreData);
    }
  }

  // Method to get connected clients count (for monitoring)
  getConnectedClients() {
    return this.clients.size;
  }
}

// Export a singleton instance
module.exports = new WebSocketService();
