const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createDb(dbPath) {
  const resolved = path.resolve(dbPath);
  ensureDir(path.dirname(resolved));
  const db = new Database(resolved);
  db.pragma('journal_mode = WAL');
  return db;
}

module.exports = {
  createDb
};
