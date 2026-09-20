const fs = require('fs');
const path = require('path');

const hasDatabase = Boolean(process.env.DATABASE_URL);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const defaultState = {
  settings: { notifications: true, dark: false, birthday: true, autoSave: true, brightness: 100 },
  classes: ['أولى إعدادي', 'ثانية إعدادي', 'ثالثة إعدادي', 'أولى ثانوي', 'ثانية ثانوي', 'ثالثة ثانوي', 'خريجين'],
  members: [],
  attendance: [],
  visits: []
};

let pool;
let fileDb;

if (hasDatabase) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PG_POOL_MAX || 20),
    idleTimeoutMillis: 30000
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureFileDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fileDb = { state: clone(defaultState), users: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(fileDb, null, 2), 'utf8');
    return;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    fileDb = {
      state: parsed.state && typeof parsed.state === 'object' ? parsed.state : clone(defaultState),
      users: Array.isArray(parsed.users) ? parsed.users : []
    };
  } catch (error) {
    console.error('تعذر قراءة ملف البيانات، سيتم إنشاء ملف جديد:', error.message);
    fileDb = { state: clone(defaultState), users: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(fileDb, null, 2), 'utf8');
  }
}

function saveFileDb() {
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(fileDb, null, 2), 'utf8');
  fs.renameSync(temp, DATA_FILE);
}

async function init() {
  if (!pool) {
    ensureFileDb();
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id integer PRIMARY KEY CHECK (id = 1),
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      phone text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'user',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(
    'INSERT INTO app_state (id, data) VALUES (1, $1) ON CONFLICT (id) DO NOTHING',
    [defaultState]
  );
}

async function getState() {
  if (!pool) return clone(fileDb.state);
  const result = await pool.query('SELECT data FROM app_state WHERE id = 1');
  return result.rows[0] ? result.rows[0].data : clone(defaultState);
}

async function updateState(data) {
  if (!pool) {
    fileDb.state = clone(data);
    saveFileDb();
    return;
  }
  await pool.query('UPDATE app_state SET data = $1, updated_at = now() WHERE id = 1', [data]);
}

async function findUser(phone) {
  if (!pool) return fileDb.users.find(user => user.phone === phone) || null;
  const result = await pool.query(
    'SELECT id, phone, password_hash AS "passwordHash", role FROM users WHERE phone = $1',
    [phone]
  );
  return result.rows[0] || null;
}

async function countUsers() {
  if (!pool) return fileDb.users.length;
  const result = await pool.query('SELECT COUNT(*) FROM users');
  return Number(result.rows[0].count);
}

async function createUser(user) {
  if (!pool) {
    fileDb.users.push({
      id: user.id,
      phone: user.phone,
      passwordHash: user.passwordHash,
      role: user.role
    });
    saveFileDb();
    return { id: user.id, phone: user.phone, role: user.role };
  }
  const result = await pool.query(
    `INSERT INTO users (id, phone, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, phone, role`,
    [user.id, user.phone, user.passwordHash, user.role]
  );
  return result.rows[0];
}

module.exports = { pool, init, getState, updateState, findUser, countUsers, createUser };
