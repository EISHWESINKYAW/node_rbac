const path = require('path')
const fs = require('fs')
const { open, run, get, all, resolveDbPath } = require('./db')

let defaultDb = null

async function init(options = {}) {
  const dbPath = options.dbPath
  defaultDb = open(dbPath)
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_create_tables.sql'), 'utf8')
  await new Promise((resolve, reject) => defaultDb.exec(sql, err => (err ? reject(err) : resolve())))
  return defaultDb
}

function db() {
  if (!defaultDb) defaultDb = open()
  return defaultDb
}

async function createUser({ email, externalId }) {
  const d = db()
  if (email) {
    const existing = await get(d, 'SELECT id FROM users WHERE email = ?', [email])
    if (existing) return existing.id
  }
  if (externalId) {
    const existing = await get(d, 'SELECT id FROM users WHERE external_id = ?', [externalId])
    if (existing) return existing.id
  }
  const res = await run(d, 'INSERT INTO users(email, external_id) VALUES(?, ?)', [email || null, externalId || null])
  return res.lastID
}

async function findUserByEmail(email) {
  const d = db()
  return await get(d, 'SELECT * FROM users WHERE email = ?', [email])
}

async function upsertRole({ name, slug, description }) {
  const d = db()
  const r = await get(d, 'SELECT id FROM roles WHERE slug = ?', [slug])
  if (r) return r.id
  const res = await run(d, 'INSERT INTO roles(name, slug, description) VALUES(?, ?, ?)', [name, slug, description || null])
  return res.lastID
}

async function upsertPermission({ name, slug, description }) {
  const d = db()
  const p = await get(d, 'SELECT id FROM permissions WHERE slug = ?', [slug])
  if (p) return p.id
  const res = await run(d, 'INSERT INTO permissions(name, slug, description) VALUES(?, ?, ?)', [name, slug, description || null])
  return res.lastID
}

async function assignRole(userId, role) {
  const d = db()
  let roleId = role
  if (typeof role === 'string') {
    const r = await get(d, 'SELECT id FROM roles WHERE slug = ? OR name = ?', [role, role])
    if (!r) return null
    roleId = r.id
  }
  await run(d, 'INSERT OR IGNORE INTO user_roles(user_id, role_id) VALUES(?, ?)', [userId, roleId])
  return true
}

async function removeRole(userId, role) {
  const d = db()
  let roleId = role
  if (typeof role === 'string') {
    const r = await get(d, 'SELECT id FROM roles WHERE slug = ? OR name = ?', [role, role])
    if (!r) return false
    roleId = r.id
  }
  await run(d, 'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?', [userId, roleId])
  return true
}

async function hasRole(userId, role) {
  const d = db()
  if (typeof role === 'string') {
    const row = await get(d, 'SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ? AND (r.slug = ? OR r.name = ?)', [userId, role, role])
    return !!row
  }
  const row = await get(d, 'SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ?', [userId, role])
  return !!row
}

async function givePermissionTo(userId, permission) {
  const d = db()
  let permissionId = permission
  if (typeof permission === 'string') {
    const p = await get(d, 'SELECT id FROM permissions WHERE slug = ? OR name = ?', [permission, permission])
    if (!p) return null
    permissionId = p.id
  }
  await run(d, 'INSERT OR IGNORE INTO user_permissions(user_id, permission_id) VALUES(?, ?)', [userId, permissionId])
  return true
}

async function revokePermissionTo(userId, permission) {
  const d = db()
  let permissionId = permission
  if (typeof permission === 'string') {
    const p = await get(d, 'SELECT id FROM permissions WHERE slug = ? OR name = ?', [permission, permission])
    if (!p) return false
    permissionId = p.id
  }
  await run(d, 'DELETE FROM user_permissions WHERE user_id = ? AND permission_id = ?', [userId, permissionId])
  return true
}

async function hasPermissionTo(userId, permission) {
  const d = db()
  if (typeof permission === 'string') {
    const direct = await get(d, 'SELECT 1 FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = ? AND (p.slug = ? OR p.name = ?)', [userId, permission, permission])
    if (direct) return true
    const viaRole = await get(d, 'SELECT 1 FROM user_roles ur JOIN role_permissions rp ON ur.role_id = rp.role_id JOIN permissions p ON rp.permission_id = p.id WHERE ur.user_id = ? AND (p.slug = ? OR p.name = ?)', [userId, permission, permission])
    return !!viaRole
  }
  const direct = await get(d, 'SELECT 1 FROM user_permissions WHERE user_id = ? AND permission_id = ?', [userId, permission])
  if (direct) return true
  const viaRole = await get(d, 'SELECT 1 FROM user_roles ur JOIN role_permissions rp ON ur.role_id = rp.role_id WHERE ur.user_id = ? AND rp.permission_id = ?', [userId, permission])
  return !!viaRole
}

async function attachPermissionToRole(role, permission) {
  const d = db()
  let roleId = role
  if (typeof role === 'string') {
    const r = await get(d, 'SELECT id FROM roles WHERE slug = ? OR name = ?', [role, role])
    if (!r) return null
    roleId = r.id
  }
  let permissionId = permission
  if (typeof permission === 'string') {
    const p = await get(d, 'SELECT id FROM permissions WHERE slug = ? OR name = ?', [permission, permission])
    if (!p) return null
    permissionId = p.id
  }
  await run(d, 'INSERT OR IGNORE INTO role_permissions(role_id, permission_id) VALUES(?, ?)', [roleId, permissionId])
  return true
}

function slugify(s) {
  return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function seedPermissions(items) {
  const d = db()
  for (const item of items) {
    let name = null
    let slug = null
    let description = null
    if (typeof item === 'string') {
      name = item
      slug = slugify(item)
    } else {
      name = item.name || item.slug
      slug = item.slug || slugify(item.name || '')
      description = item.description || null
    }
    if (!name || !slug) continue
    await upsertPermission({ name, slug, description })
  }
}

module.exports = {
  init,
  db,
  createUser,
  findUserByEmail,
  upsertRole,
  upsertPermission,
  assignRole,
  removeRole,
  hasRole,
  givePermissionTo,
  revokePermissionTo,
  hasPermissionTo,
  attachPermissionToRole,
  seedPermissions,
  resolveDbPath
}
