const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { findUserByUsername } = require('./db');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret';

// Логін
router.post('/login', async (req, res) => {
  console.log('login');
  
  const { username, password } = req.body;

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Генерація JWT
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

module.exports = router;
