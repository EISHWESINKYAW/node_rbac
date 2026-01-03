# Node RBAC Package

Role-based access control for Node.js with SQLite storage, migrations, seeding, and Express-compatible middleware.

## Install
```
npm install @rbac-package/node-rbac sqlite3
```

## Quick Start
- Migrate:
```
rbac-migrate --db ./rbac.db
```
- Seed default permissions:
```
rbac-permissions --db ./rbac.db
```

## Usage
```
const rbac = require('@rbac-package/node-rbac')

await rbac.init({ dbPath: './rbac.db' })

const userId = await rbac.createUser({ email: 'admin@example.com' })
const roleId = await rbac.upsertRole({ name: 'Admin', slug: 'admin' })
await rbac.assignRole(userId, 'admin')

const permId = await rbac.upsertPermission({ name: 'Edit Articles', slug: 'edit-articles' })
await rbac.attachPermissionToRole('admin', 'edit-articles')

const ok = await rbac.hasPermissionTo(userId, 'edit-articles')
```

## Express Middleware
```
const { requireRole } = require('@rbac-package/node-rbac/middleware/role')
const { requirePermission } = require('@rbac-package/node-rbac/middleware/permission')

app.get('/admin', requireRole('admin'), handler)
app.post('/articles', requirePermission('create'), handler)
```
`req.user.id` must contain the RBAC user id.

## CLI
- `rbac-migrate [--db path]` runs migrations
- `rbac-permissions [--db path] [--from permissions.json]` seeds permissions
- `rbac-seed [--db path] [--file sample.json]` seeds roles, permissions, users and links

### Sample Seeder
- Seed built-in sample:
```
rbac-seed --db ./rbac.db
```
- Or from provided JSON:
```
rbac-seed --db ./rbac.db --file ./node-rbac/seeds/sample.json
```
- Seed only permissions:
```
rbac-permissions --db ./rbac.db --from ./node-rbac/seeds/permissions.json
```

## API
- `init({ dbPath })`
- `createUser({ email, externalId })`
- `upsertRole({ name, slug, description })`
- `upsertPermission({ name, slug, description })`
- `assignRole(userId, role)`
- `removeRole(userId, role)`
- `hasRole(userId, role)`
- `givePermissionTo(userId, permission)`
- `revokePermissionTo(userId, permission)`
- `hasPermissionTo(userId, permission)`
- `attachPermissionToRole(role, permission)`
