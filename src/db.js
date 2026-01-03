const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3')

function resolveDbPath(p) {
  if (p) return path.resolve(p)
  return process.env.RBAC_DB_PATH ? path.resolve(process.env.RBAC_DB_PATH) : path.join(process.cwd(), 'rbac.db')
}

function open(dbPath) {
  const full = resolveDbPath(dbPath)
  const dir = path.dirname(full)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const db = new sqlite3.Database(full)
  return db
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err)
      resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) return reject(err)
      resolve(row)
    })
  })
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

module.exports = { open, run, get, all, resolveDbPath }
