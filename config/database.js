const mysql = require("mysql2");
const path = require('path');
const dotenv = require('dotenv');

// Ensure we load the backend/.env regardless of current working directory
const envPath = path.join(__dirname, '..', '.env');
const dotenvResult = dotenv.config({ path: envPath });
if (dotenvResult.error) {
  console.warn('dotenv: could not load .env at', envPath, dotenvResult.error);
} else {
  console.log('dotenv: loaded env from', envPath);
}

// Build initial config from env
const initialConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pydah_college',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
 

// Debug (safe)
console.log("DB_USER length:", (process.env.DB_USER || "").length);
console.log(
  "DB_PASSWORD present:",
  !!process.env.DB_PASSWORD,
  "length:",
  (process.env.DB_PASSWORD || "").length
);

let pool = mysql.createPool(initialConfig);

// Test the connection and fallback to localhost if remote DB unreachable
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to configured MySQL:', err && err.code ? err.code : err);
    // If host was not localhost, attempt a local fallback to help development
    if ((initialConfig.host || '').toLowerCase() !== 'localhost') {
      console.log('Attempting fallback to local MySQL (localhost:3306)');
      const fallbackConfig = Object.assign({}, initialConfig, {
        host: 'localhost',
        port: 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pydah_college'
      });
      pool = mysql.createPool(fallbackConfig);
      // Test fallback
      pool.getConnection((err2, conn2) => {
        if (err2) {
          console.error('Fallback local MySQL connection failed:', err2);
          return;
        }
        console.log('Connected to fallback local MySQL database');
        conn2.release();
      });
      return;
    }
    return;
  }
  console.log('Connected to MySQL database');
  connection.release();
  // Run initialization in background (non-blocking)
  initializeDatabaseIfNeeded();
});

// Promise-based pool
// Create a promise-based pool for async/await callers (use the possibly replaced pool)
const promisePool = pool.promise();

// If running in development, ensure required tables exist by running setup SQL files
async function initializeDatabaseIfNeeded() {
  try {
    if (process.env.NODE_ENV === 'production') return;
    // Check for users table
    const [tables] = await promisePool.query("SHOW TABLES LIKE 'users'");
    if (tables && tables.length > 0) {
      console.log('Database schema appears present.');
      return;
    }
    console.log('No users table found — initializing database schema from SQL files (dev only).');
    const fs = require('fs');
    const path = require('path');
    const sqlFiles = ['users.sql', 'pending_users.sql', 'admin.sql', 'setup_database.sql'];
    for (const f of sqlFiles) {
      const p = path.join(__dirname, '..', f);
      if (!fs.existsSync(p)) {
        console.warn('SQL file not found, skipping:', p);
        continue;
      }
      const sql = fs.readFileSync(p, 'utf8');
      // Split statements by semicolon and execute sequentially
      const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        try {
          await promisePool.query(stmt);
        } catch (err) {
          console.error('Error executing SQL statement during init:', err && err.message);
        }
      }
      console.log('Executed', f);
    }
  } catch (err) {
    console.error('Database initialization check failed:', err && err.message);
  }
}

// Unified export
const db = {
  query: (sql, params, cb) => {
    if (typeof params === "function") {
        const origCb = params;
        const wrappedCb = (err, results, fields) => {
          if (err) {
            console.error('DB query error (callback):', { sql, message: err.message, code: err.code });
          }
          return origCb(err, results, fields);
        };
        return pool.query(sql, wrappedCb);
    }
    if (typeof cb === "function") {
        const wrappedCb = (err, results, fields) => {
          if (err) {
            console.error('DB query error (callback):', { sql, params, message: err.message, code: err.code });
          }
          return cb(err, results, fields);
        };
        return pool.query(sql, params, wrappedCb);
    }
      return promisePool.query(sql, params).catch(err => {
        console.error('DB query error (promise):', { sql, params, message: err.message, code: err.code });
        throw err;
      });
  },
  pool,
  promisePool
};

module.exports = db;
