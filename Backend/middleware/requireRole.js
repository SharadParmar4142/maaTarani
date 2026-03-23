const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role) {
    res.status(401);
    throw new Error("User is not authorized");
  }

  if (!allowedRoles.includes(req.user.role)) {
    res.status(403);
    throw new Error("Access denied");
  }

  next();
};

module.exports = requireRole;
