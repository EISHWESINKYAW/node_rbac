#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { init, seedPermissions } = require('../src/rbac')

async function main() {
  const dbPathArgIndex = process.argv.indexOf('--db')
  const dbPath = dbPathArgIndex !== -1 ? process.argv[dbPathArgIndex + 1] : undefined
  await init({ dbPath })
  const fromIndex = process.argv.indexOf('--from')
  let items
  if (fromIndex !== -1) {
    const filePath = process.argv[fromIndex + 1]
    const full = path.resolve(filePath)
    const content = fs.readFileSync(full, 'utf8')
    items = JSON.parse(content)
  } else {
    items = ['View Any', 'View', 'Create', 'Update', 'Delete']
  }
  await seedPermissions(items)
  process.stdout.write('Permissions seeded\n')
}

main().catch(err => {
  process.stderr.write(String(err) + '\n')
  process.exit(1)
})
