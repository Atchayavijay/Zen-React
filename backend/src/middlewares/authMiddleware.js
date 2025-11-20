const { verifyAccessToken } = require("../services/jwtService");

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Access Denied. No token provided." });

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      ...decoded,
      role: decoded.role ?? decoded.r_id ?? decoded.role_id,
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};



exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied: Insufficient role permissions." });
    }
    next();
  };
};
