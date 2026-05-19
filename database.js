const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const os = require('os');
const path = require('path');

dotenv.config();

let client;
let usingFallback = false;

function initClient() {
  // Use OS temporary directory to work cross-platform (Windows / Linux / Vercel)
  const fallbackPath = path.join(os.tmpdir(), 'ccs_local_fallback.db');
  const url = (!usingFallback && process.env.TURSO_DATABASE_URL) ? process.env.TURSO_DATABASE_URL : `file:${fallbackPath}`;
  const authToken = (!usingFallback && process.env.TURSO_AUTH_TOKEN) ? process.env.TURSO_AUTH_TOKEN : '';
  
  client = createClient({ url, authToken });
  console.log(`Database client configured for: ${url.startsWith('file:') ? `Local Fallback (${fallbackPath})` : 'Turso Cloud'}`);
}

initClient();

const db = {
  execute: async (options) => {
    try {
      return await client.execute(options);
    } catch (error) {
      if (!usingFallback && (error.message.includes('401') || error.message.includes('unauthorized') || error.message.includes('SERVER_ERROR') || error.message.includes('libsql'))) {
        console.error('Database connection failed. Switching to local fallback database...', error.message);
        usingFallback = true;
        initClient();
        await initializeDatabase();
        return await client.execute(options);
      }
      throw error;
    }
  },
  batch: async (stmts, mode) => {
    try {
      return await client.batch(stmts, mode);
    } catch (error) {
      if (!usingFallback && (error.message.includes('401') || error.message.includes('unauthorized') || error.message.includes('SERVER_ERROR') || error.message.includes('libsql'))) {
        console.error('Database connection failed. Switching to local fallback database...', error.message);
        usingFallback = true;
        initClient();
        await initializeDatabase();
        return await client.batch(stmts, mode);
      }
      throw error;
    }
  }
};

initializeDatabase();

// Initialize database tables
async function initializeDatabase() {
  try {
    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_number TEXT UNIQUE NOT NULL,
        lastname TEXT NOT NULL,
        firstname TEXT NOT NULL,
        middlename TEXT,
        course_level TEXT NOT NULL,
        course TEXT NOT NULL,
        address TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        photo TEXT,
        sessions INTEGER DEFAULT 30,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table ready');

    // Admin table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Admin table ready');

    // Insert default admin if not exists
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await db.execute({
      sql: `INSERT OR IGNORE INTO admin (username, password) VALUES (?, ?)`,
      args: ['admin001', hashedPassword]
    });

    // Announcements table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Announcements table ready');

    // Sit-in records table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sitin_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        language TEXT NOT NULL,
        purpose TEXT,
        pc_number TEXT,
        time_in DATETIME DEFAULT CURRENT_TIMESTAMP,
        time_out DATETIME,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Sit-in records table ready');

    // Reservations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        lab TEXT NOT NULL,
        purpose TEXT NOT NULL,
        reservation_date DATE NOT NULL,
        reservation_time TIME NOT NULL,
        pc_number TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Reservations table ready');

    // Feedback table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        sitin_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (sitin_id) REFERENCES sitin_records(id)
      )
    `);
    console.log('Feedback table ready');

    // Lab Software table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS lab_software (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lab TEXT NOT NULL,
        software_name TEXT NOT NULL
      )
    `);
    console.log('Lab software table ready');

    // Settings table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    await db.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('reservations_enabled', 'true')`);
    console.log('Settings table ready');

    // Disabled PCs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS disabled_pcs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lab TEXT NOT NULL,
        pc_number INTEGER NOT NULL,
        UNIQUE(lab, pc_number)
      )
    `);
    console.log('Disabled PCs table ready');


  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Database helper functions
const dbHelpers = {
  // Get user by ID number
  getUserByIdNumber: async (idNumber) => {
    const { rows } = await db.execute({
      sql: 'SELECT * FROM users WHERE id_number = ?',
      args: [idNumber]
    });
    return rows[0];
  },

  // Get user by email
  getUserByEmail: async (email) => {
    const { rows } = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    return rows[0];
  },

  // Create new user
  createUser: async (userData) => {
    const { idNumber, lastname, firstname, middlename, courseLevel, course, address, email, password } = userData;
    const result = await db.execute({
      sql: `INSERT INTO users (id_number, lastname, firstname, middlename, course_level, course, address, email, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [idNumber, lastname, firstname, middlename, courseLevel, course, address, email, password]
    });
    return { id: Number(result.lastInsertRowid) };
  },

  // Get all users
  getAllUsers: async () => {
    const { rows } = await db.execute('SELECT id, id_number, lastname, firstname, middlename, course_level, course, address, email, created_at FROM users');
    return rows;
  },

  // Get admin by username
  getAdminByUsername: async (username) => {
    const { rows } = await db.execute({
      sql: 'SELECT * FROM admin WHERE username = ?',
      args: [username]
    });
    return rows[0];
  },

  // Get all announcements
  getAllAnnouncements: async () => {
    const { rows } = await db.execute('SELECT * FROM announcements ORDER BY created_at DESC');
    return rows;
  },

  // Create announcement
  createAnnouncement: async (title, content) => {
    const result = await db.execute({
      sql: 'INSERT INTO announcements (title, content) VALUES (?, ?)',
      args: [title, content]
    });
    return { id: Number(result.lastInsertRowid) };
  },

  // Get statistics
  getStatistics: async () => {
    const userRes = await db.execute('SELECT COUNT(*) as count FROM users');
    const activeRes = await db.execute("SELECT COUNT(*) as count FROM sitin_records WHERE status = 'active'");
    const totalRes = await db.execute('SELECT COUNT(*) as count FROM sitin_records');
    const langRes = await db.execute("SELECT language, COUNT(*) as count FROM sitin_records GROUP BY language");

    return {
      totalUsers: userRes.rows[0].count,
      currentlySitIn: activeRes.rows[0].count,
      totalSitIn: totalRes.rows[0].count,
      languageStats: langRes.rows
    };
  },

  // Update user profile
  updateUser: async (userId, userData) => {
    const { firstname, lastname, middlename, course, courseLevel, address, email, photo } = userData;
    const result = await db.execute({
      sql: `UPDATE users SET 
              firstname = ?, 
              lastname = ?, 
              middlename = ?, 
              course = ?, 
              course_level = ?, 
              address = ?, 
              email = ?, 
              photo = ?,
              updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [firstname, lastname, middlename, course, courseLevel, address, email, photo, userId]
    });
    return { changes: result.rowsAffected };
  },

  // Get all students (for admin)
  getAllStudents: async () => {
    const { rows } = await db.execute('SELECT id, id_number, lastname, firstname, middlename, course_level as year, course, email, sessions, photo, created_at FROM users ORDER BY lastname, firstname');
    return rows;
  },

  // Get student by ID number
  getStudentByIdNumber: async (idNumber) => {
    const { rows } = await db.execute({
      sql: 'SELECT id, id_number, lastname, firstname, middlename, course_level as year, course, address, email, sessions, photo, created_at FROM users WHERE id_number = ?',
      args: [idNumber]
    });
    return rows[0];
  },

  // Update student
  updateStudent: async (idNumber, studentData) => {
    const { firstname, lastname, middlename, course, courseLevel, email, sessions } = studentData;
    const result = await db.execute({
      sql: `UPDATE users SET 
              firstname = ?, 
              lastname = ?, 
              middlename = ?, 
              course = ?, 
              course_level = ?, 
              email = ?, 
              sessions = ?,
              updated_at = CURRENT_TIMESTAMP 
            WHERE id_number = ?`,
      args: [firstname, lastname, middlename, course, courseLevel, email, sessions, idNumber]
    });
    return { changes: result.rowsAffected };
  },

  // Delete student
  deleteStudent: async (idNumber) => {
    const result = await db.execute({
      sql: 'DELETE FROM users WHERE id_number = ?',
      args: [idNumber]
    });
    return { changes: result.rowsAffected };
  },

  // Reset all student sessions
  resetAllSessions: async () => {
    const result = await db.execute('UPDATE users SET sessions = 30');
    return { changes: result.rowsAffected };
  },

  // Create Sit-In record
  createSitInRecord: async (userId, purpose, lab, pcNumber) => {
    const result = await db.execute({
      sql: 'INSERT INTO sitin_records (user_id, language, purpose, pc_number) VALUES (?, ?, ?, ?)',
      args: [userId, purpose, lab, pcNumber || null]
    });
    return { id: Number(result.lastInsertRowid) };
  },

  // Update student sessions
  updateStudentSessions: async (idNumber, sessions) => {
    const result = await db.execute({
      sql: 'UPDATE users SET sessions = ?, updated_at = CURRENT_TIMESTAMP WHERE id_number = ?',
      args: [sessions, idNumber]
    });
    return { changes: result.rowsAffected };
  },

  // Get all sit-in records
  getAllSitInRecords: async () => {
    const { rows } = await db.execute(`
      SELECT 
        s.id,
        u.id_number,
        u.firstname,
        u.lastname,
        s.language as purpose,
        s.purpose as lab,
        s.pc_number,
        s.time_in as timeIn,
        s.status
      FROM sitin_records s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.id DESC
    `);
    return rows.map(row => ({
      id: row.id,
      id_number: row.id_number,
      name: `${row.firstname} ${row.lastname}`,
      purpose: row.purpose,
      lab: row.lab,
      pc_number: row.pc_number,
      timeIn: row.timeIn,
      status: row.status,
      session: 1
    }));
  },

  // Complete sit-in record
  completeSitInRecord: async (id) => {
    const result = await db.execute({
      sql: `UPDATE sitin_records SET status = 'completed', time_out = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [id]
    });
    return { changes: result.rowsAffected };
  },

  // Get student's sit-in history
  getStudentHistory: async (userId) => {
    const { rows } = await db.execute({
      sql: `SELECT 
              s.id,
              s.time_in as timeIn,
              s.time_out as timeOut,
              s.language as purpose,
              s.purpose as lab,
              s.pc_number,
              s.status
            FROM sitin_records s
            WHERE s.user_id = ?
            ORDER BY s.time_in DESC`,
      args: [userId]
    });
    return rows;
  },

  // Check if feedback already exists for a sit-in
  hasFeedback: async (sitinId) => {
    const { rows } = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM feedback WHERE sitin_id = ?',
      args: [sitinId]
    });
    return rows[0].count > 0;
  },

  // Create reservation
  createReservation: async (userId, lab, purpose, date, time, pcNumber) => {
    const result = await db.execute({
      sql: 'INSERT INTO reservations (user_id, lab, purpose, reservation_date, reservation_time, pc_number) VALUES (?, ?, ?, ?, ?, ?)',
      args: [userId, lab, purpose, date, time, pcNumber || null]
    });
    return { id: Number(result.lastInsertRowid) };
  },

  // Get student's reservations
  getStudentReservations: async (userId) => {
    const { rows } = await db.execute({
      sql: 'SELECT * FROM reservations WHERE user_id = ? ORDER BY reservation_date DESC, reservation_time DESC',
      args: [userId]
    });
    return rows;
  },

  // Cancel reservation
  cancelReservation: async (reservationId, userId) => {
    const result = await db.execute({
      sql: "UPDATE reservations SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'pending'",
      args: [reservationId, userId]
    });
    return { changes: result.rowsAffected };
  },

  // Create feedback
  createFeedback: async (userId, sitinId, rating, comment) => {
    const result = await db.execute({
      sql: 'INSERT INTO feedback (user_id, sitin_id, rating, comment) VALUES (?, ?, ?, ?)',
      args: [userId, sitinId, rating, comment]
    });
    return { id: Number(result.lastInsertRowid) };
  },

  // Get all feedback with student and sit-in details (for admin reports)
  getAllFeedback: async () => {
    const { rows } = await db.execute(`
      SELECT 
        f.id,
        u.firstname,
        u.lastname,
        u.id_number,
        s.purpose as lab,
        s.language as purpose,
        f.rating,
        f.comment,
        f.created_at
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      JOIN sitin_records s ON f.sitin_id = s.id
      ORDER BY f.created_at DESC
    `);
    return rows.map(row => ({
      id: row.id,
      student: `${row.firstname} ${row.lastname}`,
      id_number: row.id_number,
      lab: row.lab,
      purpose: row.purpose,
      rating: row.rating,
      comment: row.comment,
      date: row.created_at
    }));
  },

  // Get all reservations with student details (for admin)
  getAllReservations: async () => {
    const { rows } = await db.execute(`
      SELECT 
        r.id,
        u.firstname,
        u.lastname,
        u.id_number,
        r.lab,
        r.purpose,
        r.pc_number,
        r.reservation_date,
        r.reservation_time,
        r.status,
        r.created_at
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.reservation_date DESC, r.reservation_time DESC
    `);
    return rows.map(row => ({
      id: row.id,
      student: `${row.firstname} ${row.lastname}`,
      id_number: row.id_number,
      lab: row.lab,
      purpose: row.purpose,
      pc_number: row.pc_number,
      reservation_date: row.reservation_date,
      reservation_time: row.reservation_time,
      status: row.status,
      created_at: row.created_at
    }));
  },

  // Update reservation status (approve/cancel)
  updateReservationStatus: async (reservationId, status) => {
    const result = await db.execute({
      sql: 'UPDATE reservations SET status = ? WHERE id = ?',
      args: [status, reservationId]
    });
    return { changes: result.rowsAffected };
  },

  // Get student's sessions
  getStudentSessions: async (userId) => {
    const { rows } = await db.execute({
      sql: `SELECT 
              s.id,
              s.time_in as timeIn,
              s.time_out as timeOut,
              s.pc_number as pcNo,
              s.purpose as lab,
              s.status
            FROM sitin_records s
            WHERE s.user_id = ?
            ORDER BY s.time_in DESC`,
      args: [userId]
    });
    return rows;
  },

  // Get leaderboard (students ranked by total sit-in hours)
  getLeaderboard: async () => {
    const { rows } = await db.execute(`
      SELECT 
        u.id_number,
        u.firstname,
        u.lastname,
        u.course,
        COALESCE(SUM(
          CASE 
            WHEN s.time_out IS NOT NULL THEN (julianday(s.time_out) - julianday(s.time_in)) * 24
            ELSE (julianday('now') - julianday(s.time_in)) * 24
          END
        ), 0) as totalHours,
        COUNT(s.id) as sessions
      FROM users u
      LEFT JOIN sitin_records s ON u.id = s.user_id
      GROUP BY u.id
      ORDER BY totalHours DESC
      LIMIT 10
    `);
    return rows.map(row => ({
      name: `${row.firstname} ${row.lastname}`,
      course: row.course,
      totalHours: Math.round(row.totalHours * 10) / 10,
      sessions: row.sessions
    }));
  },

  // Lab Software APIs
  getLabSoftware: async (lab) => {
    if (lab) {
      const { rows } = await db.execute({
        sql: 'SELECT * FROM lab_software WHERE lab = ?',
        args: [lab]
      });
      return rows;
    } else {
      const { rows } = await db.execute('SELECT * FROM lab_software');
      return rows;
    }
  },

  addLabSoftware: async (lab, softwareName) => {
    const result = await db.execute({
      sql: 'INSERT INTO lab_software (lab, software_name) VALUES (?, ?)',
      args: [lab, softwareName]
    });
    return { id: Number(result.lastInsertRowid) };
  },

  deleteLabSoftware: async (id) => {
    const result = await db.execute({
      sql: 'DELETE FROM lab_software WHERE id = ?',
      args: [id]
    });
    return { changes: result.rowsAffected };
  },

  // Settings APIs
  getSetting: async (key) => {
    const { rows } = await db.execute({
      sql: 'SELECT value FROM settings WHERE key = ?',
      args: [key]
    });
    return rows[0] ? rows[0].value : null;
  },

  updateSetting: async (key, value) => {
    const result = await db.execute({
      sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      args: [key, value]
    });
    return { changes: result.rowsAffected };
  },

  // Analytics APIs
  getAnalytics: async () => {
    try {
      const mostUsedLabRes = await db.execute(`SELECT purpose as lab, COUNT(*) as count FROM sitin_records GROUP BY purpose ORDER BY count DESC LIMIT 1`);
      const mostUsedPurposeRes = await db.execute(`SELECT language as purpose, COUNT(*) as count FROM sitin_records GROUP BY language ORDER BY count DESC LIMIT 1`);

      return {
        mostUsedLab: mostUsedLabRes.rows[0] ? mostUsedLabRes.rows[0].lab : 'None',
        mostUsedPurpose: mostUsedPurposeRes.rows[0] ? mostUsedPurposeRes.rows[0].purpose : 'None'
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { mostUsedLab: 'Unknown', mostUsedPurpose: 'Unknown' };
    }
  },

  getDisabledPCs: async () => {
    const { rows } = await db.execute('SELECT * FROM disabled_pcs');
    return rows;
  },

  toggleDisabledPC: async (lab, pcNumber) => {
    const { rows } = await db.execute({
      sql: 'SELECT * FROM disabled_pcs WHERE lab = ? AND pc_number = ?',
      args: [String(lab), parseInt(pcNumber)]
    });

    if (rows.length > 0) {
      await db.execute({
        sql: 'DELETE FROM disabled_pcs WHERE lab = ? AND pc_number = ?',
        args: [String(lab), parseInt(pcNumber)]
      });
      return { disabled: false };
    } else {
      await db.execute({
        sql: 'INSERT INTO disabled_pcs (lab, pc_number) VALUES (?, ?)',
        args: [String(lab), parseInt(pcNumber)]
      });
      return { disabled: true };
    }
  },

  isPCDisabled: async (lab, pcNumber) => {
    const { rows } = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM disabled_pcs WHERE lab = ? AND pc_number = ?',
      args: [String(lab), parseInt(pcNumber)]
    });
    return rows[0].count > 0;
  }
};

module.exports = { dbHelpers, db };
