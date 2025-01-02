const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodeCron = require('node-cron');
const bcrypt = require('bcrypt');

// Ініціалізація бази даних
const db = new sqlite3.Database(path.join(__dirname, '../emails.db'));

// Створення таблиць
db.serialize(async () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT NOT NULL,
      account TEXT NOT NULL,
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, account)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      account TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('email_worker_enabled', 'false')
  `);

  db.run(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('email_worker_enabled', 'false')
  `);

  await createDefaultAdmin();
});

// Збереження оброблених повідомлень
function saveMessageId(messageId, account) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR IGNORE INTO messages (id, account) VALUES (?, ?)',
      [messageId, account],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// Перевірка оброблених повідомлень
function isMessageProcessed(messageId, account) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM messages WHERE id = ? AND account = ?',
      [messageId, account],
      (err, row) => (err ? reject(err) : resolve(!!row))
    );
  });
}

// Очищення старих повідомлень
function cleanOldMessages(daysToKeep) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM messages WHERE processed_at < datetime("now", ?)',
      [`-${daysToKeep} days`],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// Додавання облікового запису
function addAccount(user, password) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO accounts (user, password) VALUES (?, ?)',
      [user, password],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// Отримання всіх облікових записів
function getAccounts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM accounts', [], (err, rows) =>
      err ? reject(err) : resolve(rows)
    );
  });
}

// Створення нового користувача
function createUser(username, password) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// Пошук користувача за іменем
function findUserByUsername(username) {
  console.log('findUserByUsername');
  
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err, row) => (err ? reject(err) : resolve(row))
    );
  });
}

function deleteAccount(id) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM accounts WHERE id = ?',
      [id],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

function getSetting(key) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT value FROM settings WHERE key = ?',
      [key],
      (err, row) => (err ? reject(err) : resolve(row?.value === 'true'))
    );
  });
}

function setSetting(key, value) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value ? 'true' : 'false'],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

function addLog(account, message) {
  return new Promise((resolve, reject) => {
    // Додаємо новий лог
    db.run(
      'INSERT INTO logs (account, message) VALUES (?, ?)',
      [account, message],
      (err) => {
        if (err) {
          return reject(err);
        }

        db.get(
          'SELECT COUNT(*) AS count FROM logs WHERE account = ?',
          [account],
          (err, row) => {
            if (err) {
              return reject(err);
            }

            if (row.count > 200) {
              db.run(
                'DELETE FROM logs WHERE account = ? AND timestamp IN (SELECT timestamp FROM logs WHERE account = ? ORDER BY timestamp ASC LIMIT ?)',
                [account, account, row.count - 200],
                (err) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve();
                }
              );
            } else {
              resolve();
            }
          }
        );
      }
    );
  });
}
function getLogs(account) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM logs WHERE account = ? ORDER BY timestamp DESC',
      [account],
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });
}


function getAllLogs() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM logs ORDER BY timestamp DESC',
      [],
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });
}

function getEmailsFromDatabase() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM messages ORDER BY id DESC', [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);  // Повертаємо всі листи
    });
  });
}

async function createDefaultAdmin() {
  const defaultAdmin = {
    username: 'admin',
    password: '1234', // Рекомендується використовувати складніший пароль
  };

  try {
    const existingAdmin = await findUserByUsername(defaultAdmin.username);
    if (existingAdmin) {
      console.log('Дефолтний адміністратор вже існує');
      return;
    }

    const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
    await createUser(defaultAdmin.username, hashedPassword);

    console.log('Дефолтний адміністратор успішно створений');
  } catch (error) {
    console.error('Помилка створення дефолтного адміністратора:', error);
  }
}


module.exports = {
  saveMessageId,
  isMessageProcessed,
  cleanOldMessages,
  addAccount,
  getAccounts,
  createUser,
  findUserByUsername,
  deleteAccount,
  getSetting,
  setSetting,
  addLog,
  getLogs,
  getAllLogs,
  getEmailsFromDatabase,
};
