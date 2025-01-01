const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret';

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user; // Зберігаємо інформацію про користувача
    next();
  });
}

module.exports = { authenticateToken };
