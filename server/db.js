import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with disk
let db = null;

export function getDb() {
  if (db) return db;

  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      db = parsed && parsed.initialData ? parsed.initialData : parsed;
    } catch (err) {
      console.warn('Error reading store.json, re-initializing with seed data:', err.message);
      db = JSON.parse(JSON.stringify(initialData));
      saveDb();
    }
  } else {
    db = JSON.parse(JSON.stringify(initialData));
    saveDb();
  }
  return db;
}

export function saveDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save to store.json:', err.message);
  }
}

// Helper methods for collections
export const collection = (name) => {
  const store = getDb();
  if (!store[name]) {
    store[name] = [];
  }
  return {
    getAll: () => store[name],
    find: (predicate) => store[name].filter(predicate),
    findOne: (predicate) => store[name].find(predicate),
    findById: (id) => store[name].find(item => item.id === id),
    insert: (doc) => {
      if (!doc.id) {
        doc.id = `${name.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      if (!doc.created_at) {
        doc.created_at = new Date().toISOString();
      }
      store[name].push(doc);
      saveDb();
      return doc;
    },
    update: (id, updates) => {
      const index = store[name].findIndex(item => item.id === id);
      if (index === -1) return null;
      store[name][index] = { ...store[name][index], ...updates, updated_at: new Date().toISOString() };
      saveDb();
      return store[name][index];
    },
    remove: (id) => {
      const index = store[name].findIndex(item => item.id === id);
      if (index === -1) return false;
      store[name].splice(index, 1);
      saveDb();
      return true;
    },
    reset: () => {
      db = JSON.parse(JSON.stringify(initialData));
      saveDb();
      return db;
    }
  };
};
