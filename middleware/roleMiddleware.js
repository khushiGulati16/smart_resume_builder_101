const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).send("Unauthorized");
    if (!roles.includes(req.user.role)) return res.status(403).send("Forbidden");
    next();
  };
};

module.exports = { requireRole };
