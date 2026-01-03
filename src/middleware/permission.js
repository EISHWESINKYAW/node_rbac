const { hasPermissionTo } = require('../rbac')

function requirePermission(...permissions) {
  return async function (req, res, next) {
    const user = req.user
    if (!user || !user.id) return res.status(403).end()
    for (const p of permissions) {
      if (await hasPermissionTo(user.id, p)) return next()
    }
    return res.status(403).end()
  }
}

module.exports = { requirePermission }
