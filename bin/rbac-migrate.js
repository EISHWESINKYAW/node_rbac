#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { open, resolveDbPath } = require('../src/db')

async function main() {
  const dbPathArgIndex = process.argv.indexOf('--db')
  const dbPath = dbPathArgIndex !== -1 ? process.argv[dbPathArgIndex + 1] : undefined
  const db = open(dbPath)
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_create_tables.sql'), 'utf8')
  await new Promise((resolve, reject) => db.exec(sql, err => (err ? reject(err) : resolve())))
  const full = resolveDbPath(dbPath)
  process.stdout.write(`Migrated: ${full}\n`)
}

main().catch(err => {
  process.stderr.write(String(err) + '\n')
  process.exit(1)
})
