const express = require('express');
const router = express.Router();
const webSocketService = require('../../services/websocket.service');
const { authenticate, authorize } = require('../../middlewares/auth');

/**
 * @route   GET /api/v1/websocket/analytics-room
 * @desc    Get analytics room information (Admin only)
 * @access  Private (Admin only)
 */
router.get('/analytics-room', authenticate, authorize('admin'), (req, res) => {
  try {
    if (!webSocketService.io) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket server not initialized',
      });
    }

    const room = webSocketService.io.sockets.adapter.rooms.get('analytics');
    const clientCount = room ? room.size : 0;
    
    return res.json({
      success: true,
      data: {
        room: 'analytics',
        clientCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting analytics room info:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
