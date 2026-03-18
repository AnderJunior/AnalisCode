const mysql = require('mysql2/promise');
const crypto = require('crypto');
const config = require('./config');

let pool = null;

function getDB() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = { getDB, generateToken };
