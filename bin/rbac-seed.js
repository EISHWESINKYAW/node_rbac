#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const rbac = require('../src/rbac')

function parseArg(name) {
  const i = process.argv.indexOf(name)
  return i !== -1 ? process.argv[i + 1] : undefined
}

async function seedFromObject(obj) {
  const roles = obj.roles || []
  const permissions = obj.permissions || []
  const users = obj.users || []
  const rolePermissions = obj.rolePermissions || []
  const userRoles = obj.userRoles || []
  const userPermissions = obj.userPermissions || []

  for (const role of roles) {
    await rbac.upsertRole({ name: role.name, slug: role.slug, description: role.description })
  }
  await rbac.seedPermissions(permissions)

  const userIdByEmail = {}
  for (const u of users) {
    const id = await rbac.createUser({ email: u.email, externalId: u.externalId })
    userIdByEmail[u.email] = id
  }

  for (const rp of rolePermissions) {
    await rbac.attachPermissionToRole(rp.role, rp.permission)
  }

  for (const ur of userRoles) {
    const uid = typeof ur.user === 'number' ? ur.user : userIdByEmail[ur.user]
    if (!uid) continue
    await rbac.assignRole(uid, ur.role)
  }

  for (const up of userPermissions) {
    const uid = typeof up.user === 'number' ? up.user : userIdByEmail[up.user]
    if (!uid) continue
    await rbac.givePermissionTo(uid, up.permission)
  }
}

async function main() {
  const dbPath = parseArg('--db')
  const file = parseArg('--file') || parseArg('--from')
  await rbac.init({ dbPath })

  let obj
  if (file) {
    const full = path.resolve(file)
    obj = JSON.parse(fs.readFileSync(full, 'utf8'))
  } else {
    obj = {
      roles: [
        { name: 'Admin', slug: 'admin' },
        { name: 'Editor', slug: 'editor' }
      ],
      permissions: [
        'View Any',
        'View',
        'Create',
        'Update',
        'Delete',
        'Publish'
      ],
      users: [
        { email: 'admin@example.com' },
        { email: 'editor@example.com' }
      ],
      rolePermissions: [
        { role: 'admin', permission: 'view-any' },
        { role: 'admin', permission: 'view' },
        { role: 'admin', permission: 'create' },
        { role: 'admin', permission: 'update' },
        { role: 'admin', permission: 'delete' },
        { role: 'admin', permission: 'publish' },
        { role: 'editor', permission: 'view' },
        { role: 'editor', permission: 'create' },
        { role: 'editor', permission: 'update' }
      ],
      userRoles: [
        { user: 'admin@example.com', role: 'admin' },
        { user: 'editor@example.com', role: 'editor' }
      ]
    }
  }

  await seedFromObject(obj)
  process.stdout.write('Sample RBAC data seeded\n')
}

main().catch(err => {
  process.stderr.write(String(err) + '\n')
  process.exit(1)
})
