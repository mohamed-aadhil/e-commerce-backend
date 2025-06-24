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

  /**
   * Broadcast genre distribution updates to all clients in the analytics room
   * @param {Object} data - The genre data to broadcast
   */
  broadcastGenreUpdate(data) {
    if (this.io) {
      this.io.to('analytics').emit('genre-data-updated', {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      });
    }
  }

  /**
   * Broadcast price analysis updates to all clients in the analytics room
   * @param {Object} data - The price analysis data to broadcast
   */
  broadcastPriceUpdate(data) {
    if (this.io) {
      this.io.to('analytics').emit('price-data-updated', {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      });
    }
  }

  /**
   * Broadcast inventory updates to all clients in the analytics room
   * @param {Object} data - The inventory data to broadcast
   */
  broadcastInventoryUpdate(data) {
    if (this.io) {
      this.io.to('analytics').emit('inventory-updated', {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      });
    }
  }

  // Method to get connected clients count (for monitoring)
  getConnectedClients() {
    return this.clients.size;
  }
}

// Export a singleton instance
module.exports = new WebSocketService();
