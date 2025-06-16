const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/v1/test/session:
 *   get:
 *     summary: Test session persistence
 *     description: Returns the current session ID and a counter that increments with each request
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Session information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: The current session ID
 *                 counter:
 *                   type: number
 *                   description: A counter that increments with each request
 */
router.get('/session', (req, res) => {
  // Initialize counter if it doesn't exist
  if (!req.session.counter) {
    req.session.counter = 0;
  }
  
  // Increment counter
  req.session.counter++;
  
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  
  res.json({
    sessionId: req.sessionID,
    counter: req.session.counter,
    cookie: req.session.cookie
  });
});

module.exports = router;
