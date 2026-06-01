

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role ? req.user.role.toLowerCase() : "";
    const allowedRoles = roles.map(r => r.toLowerCase());
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    next();
  };
};