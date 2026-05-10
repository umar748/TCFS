import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    req.user = decoded; // { userId: ... }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

export const adminMiddleware = async (req, res, next) => {
  // Assuming authMiddleware has already run and populated req.user.userId
  // We need to fetch the user to check role, OR we could have encoded role in token.
  // For safety, let's fetch user or assume role was added to req.user by authMiddleware if we update it.
  // But wait, authMiddleware only decodes the token.
  // Let's import User model to check role.
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.userId);
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    }
  } catch (error) {
    console.error("Admin Middleware Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const protect = authMiddleware;

export default authMiddleware;
