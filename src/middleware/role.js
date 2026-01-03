const { hasRole } = require('../rbac')

function requireRole(...roles) {
  return async function (req, res, next) {
    const user = req.user
    if (!user || !user.id) return res.status(403).end()
    for (const role of roles) {
      if (await hasRole(user.id, role)) return next()
    }
    return res.status(403).end()
  }
}

module.exports = { requireRole }
