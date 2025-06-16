const { Op } = require('sequelize');
const session = require('express-session');
const Session = require('../models/session.model');

class SessionStore extends session.Store {
  constructor() {
    super();
    this.Session = Session;
    console.log('SessionStore initialized');
  }

  async get(sid, callback) {
    console.log(`Getting session: ${sid}`);
    try {
      const session = await this.Session.findByPk(sid);
      if (!session) {
        console.log('No session found');
        return callback(null, null);
      }
      
      console.log('Session found:', session.toJSON());
      const data = session.get('data');
      return callback(null, { ...data, cookie: { ...data.cookie } });
    } catch (err) {
      console.error('Error getting session:', err);
      return callback(err);
    }
  }

  async set(sid, session, callback) {
    console.log(`Setting session: ${sid}`);
    try {
      const expires = session.cookie?.expires
        ? new Date(session.cookie.expires)
        : new Date(Date.now() + (session.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000));

      console.log('Session data to save:', {
        sid,
        expires,
        data: session,
        userId: session.passport?.user || null,
      });

      const [sessionRecord, created] = await this.Session.upsert({
        sid,
        expires,
        data: session,
        userId: session.passport?.user || null,
      });
      
      console.log(created ? 'New session created' : 'Session updated', sessionRecord.toJSON());
      return callback(null);
    } catch (err) {
      console.error('Error setting session:', err);
      return callback(err);
    }
  }

  async destroy(sid, callback) {
    console.log(`Destroying session: ${sid}`);
    try {
      const result = await this.Session.destroy({ where: { sid } });
      console.log(`Session destroyed: ${result ? 'Success' : 'Not found'}`);
      return callback(null);
    } catch (err) {
      console.error('Error destroying session:', err);
      return callback(err);
    }
  }

  async touch(sid, session, callback) {
    console.log(`Touching session: ${sid}`);
    try {
      const expires = session.cookie?.expires
        ? new Date(session.cookie.expires)
        : new Date(Date.now() + (session.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000));

      console.log('Updating session expires:', expires);
      await this.Session.update(
        { expires },
        { where: { sid } }
      );
      
      return callback(null);
    } catch (err) {
      console.error('Error touching session:', err);
      return callback(err);
    }
  }

  async all(callback) {
    console.log('Getting all sessions');
    try {
      const sessions = await this.Session.findAll();
      console.log('Sessions found:', sessions.map(session => session.toJSON()));
      return callback(null, sessions.map(session => session.data));
    } catch (err) {
      console.error('Error getting all sessions:', err);
      return callback(err);
    }
  }

  async clear(callback) {
    console.log('Clearing all sessions');
    try {
      const result = await this.Session.destroy({ where: {} });
      console.log(`Sessions cleared: ${result} sessions deleted`);
      return callback(null);
    } catch (err) {
      console.error('Error clearing sessions:', err);
      return callback(err);
    }
  }

  async length(callback) {
    console.log('Getting session count');
    try {
      const count = await this.Session.count();
      console.log(`Session count: ${count}`);
      return callback(null, count);
    } catch (err) {
      console.error('Error getting session count:', err);
      return callback(err);
    }
  }

  async clearExpiredSessions() {
    console.log('Clearing expired sessions');
    try {
      const count = await this.Session.destroy({
        where: {
          expires: {
            [Op.lt]: new Date(),
          },
        },
      });
      console.log(`Expired sessions cleared: ${count} sessions deleted`);
    } catch (err) {
      console.error('Error clearing expired sessions:', err);
    }
  }
}

// Initialize and export the store
const sessionStore = new SessionStore();

// Log when sessions are cleaned up
setInterval(async () => {
  try {
    const count = await Session.destroy({
      where: {
        expires: { [Op.lt]: new Date() }
      }
    });
    if (count > 0) {
      console.log(`Cleaned up ${count} expired sessions`);
    }
  } catch (err) {
    console.error('Error cleaning up sessions:', err);
  }
}, 15 * 60 * 1000); // Run every 15 minutes

module.exports = sessionStore;
