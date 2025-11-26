import * as SQLite from 'expo-sqlite';

// Database setup and initialization
let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async () => {
  try {
    // Open or create the database
    db = await SQLite.openDatabaseAsync('notebootst.db');

    // Create tables if they don't exist
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      -- Users table with referral system
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        referral_code TEXT UNIQUE NOT NULL,
        credits INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        used_referral_code TEXT,
        FOREIGN KEY (used_referral_code) REFERENCES users(referral_code)
      );

      -- Referrals table (tracks who referred whom)
      CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_code TEXT NOT NULL,
        referee_id TEXT NOT NULL,
        referee_code TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        status TEXT DEFAULT 'completed',
        FOREIGN KEY (referrer_code) REFERENCES users(referral_code),
        FOREIGN KEY (referee_id) REFERENCES users(id),
        UNIQUE(referee_id)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
      CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_code);
      CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
      CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
    `);

    // Migration: Add credits column if it doesn't exist
    try {
      // Check if credits column exists
      const tableInfo = await db.getAllAsync<any>('PRAGMA table_info(users)');
      const hasCreditsColumn = tableInfo.some((col: any) => col.name === 'credits');

      if (!hasCreditsColumn) {
        console.log('[Database] Running migration: Adding credits column to users table');
        await db.execAsync('ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0');
        console.log('[Database] Migration completed: credits column added');
      }
    } catch (migrationError) {
      console.error('[Database] Migration error:', migrationError);
      // If migration fails, it might be because column already exists or other issue
      // Don't throw here, let the app continue
    }

    console.log('[Database] Initialized successfully');
    return db;
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  }
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Helper function to close database (cleanup)
export const closeDatabase = async () => {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('[Database] Closed');
  }
};
