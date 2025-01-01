const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodeCron = require('node-cron');
const { fetchLatestEmails } = require('./src/imapService');
const { startWorker } = require('./src/emailWorker');
const {
  createUser,
  findUserByUsername,
  addAccount,
  deleteAccount,
  getAccounts, getEmailsFromDatabase,
  getSetting, setSetting, getAllLogs, addLog
} = require('./src/db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret'; // Секрет для JWT

// Middleware
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', status: 'ok' });
});

// User registration (одноразова реєстрація для тесту)
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await createUser(username, hashedPassword);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error during registration', error });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
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

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error });
  }
});

// Token validation middleware
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Get all accounts (protected)
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await getAccounts();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching accounts', error: err.message });
  }
});

// Add a new account (protected)
app.post('/api/accounts', authenticateToken, async (req, res) => {
  const { user, password } = req.body;
  if (!user || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await addAccount(user, password);
    res.json({ message: 'Account added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding account', error: err.message });
  }
});

// Delete an account (protected)
app.delete('/api/accounts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await deleteAccount(id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting account', error: err.message });
  }
});

// Trigger email fetching (protected)
app.post('/api/check-emails', authenticateToken, async (req, res) => {
  try {
    const accounts = await getAccounts();
    for (const account of accounts) {
      await fetchLatestEmails(account);
    }
    res.json({ message: 'Email check completed' });
  } catch (err) {
    res.status(500).json({ message: 'Error checking emails', error: err.message });
  }
});


app.get('/api/worker/status', authenticateToken, async (req, res) => {
  try {
    const isEnabled = await getSetting('email_worker_enabled');
    res.json({ enabled: isEnabled });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching worker status', error: err.message });
  }
});

app.post('/api/worker/status', authenticateToken, async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ message: 'Invalid value for enabled. It must be a boolean.' });
  }

  try {
    await setSetting('email_worker_enabled', enabled);
    res.json({ message: `Worker status updated to ${enabled ? 'enabled' : 'disabled'}` });
  } catch (err) {
    res.status(500).json({ message: 'Error updating worker status', error: err.message });
  }
});

app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await getAllLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching logs', error: err.message });
  }
});

app.get('/api/emails', authenticateToken, async (req, res) => {
  try {
    const emails = await getEmailsFromDatabase(); // Функція для отримання листів
    res.json(emails);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching emails', error: err.message });
  }
});

// Schedule periodic email fetching
nodeCron.schedule('*/5 * * * *', async () => {
  console.log('Running scheduled email check...');
  const accounts = await getAccounts();
  for (const account of accounts) {
    try {
      await fetchLatestEmails(account);
    } catch (err) {
      console.error(`Error checking emails for ${account.user}:`, err.message);
    }
  }
});

startWorker()

app.listen(PORT, () => {
  const HOST = process.env.HOST || 'localhost';
  const url = `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${url}`);
  addLog('SYSTEM', `Server is running on ${url}`);
});