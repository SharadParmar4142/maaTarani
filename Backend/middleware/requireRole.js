const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role) {
    res.status(401);
    throw new Error("User is not authorized");
  }

  const normalizedUserRole = String(req.user.role).toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toLowerCase());

  if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
    res.status(403);
    throw new Error("Access denied");
  }

  next();
};

module.exports = requireRole;
