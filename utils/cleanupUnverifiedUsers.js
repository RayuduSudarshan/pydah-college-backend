const db = require('../config/database');

async function cleanupUnverifiedUsers() {
  const query = 'DELETE FROM users WHERE is_verified = FALSE AND created_at < DATE_SUB(NOW(), INTERVAL 1 DAY)';
  try {
    const [result] = await db.query(query);
    if (result.affectedRows > 0) {
      console.log(`Cleaned up ${result.affectedRows} unverified users`);
    }
  } catch (err) {
    console.error('Error cleaning up unverified users:', err);
  }
}

// Run cleanup every hour
setInterval(cleanupUnverifiedUsers, 60 * 60 * 1000);

module.exports = { cleanupUnverifiedUsers };