import Database from "better-sqlite3";
export function createStorage(dbPath) {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, friend_id)
    );
    CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, text TEXT NOT NULL, kind TEXT NOT NULL, url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, from_id INTEGER NOT NULL, to_id INTEGER NOT NULL, text TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return {
    createUser(username, password) {
      const info = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, password);
      return { id: info.lastInsertRowid, username, password };
    },
    getUserByUsername(username) { return db.prepare("SELECT * FROM users WHERE username = ?").get(username) || null; },
    addFriend(userId, friendId) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')
      `);
      stmt.run(userId, friendId);
    },
    acceptFriend(userId, friendId) {
      const stmt = db.prepare(`
        UPDATE friends SET status = 'accepted' WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `);
      stmt.run(userId, friendId, friendId, userId);
    },
    rejectFriend(userId, friendId) {
      const stmt = db.prepare(`
        DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `);
      stmt.run(userId, friendId, friendId, userId);
    },
    removeFriend(userId, friendId) {
      const stmt = db.prepare(`
        DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `);
      stmt.run(userId, friendId, friendId, userId);
    },
    getFriends(userId) {
      return db.prepare(`
        SELECT u.id, u.username
        FROM friends f 
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ? AND f.status = 'accepted'
      `).all(userId);
    },
    getPendingRequests(userId) {
      return db.prepare(`
        SELECT u.id, u.username
        FROM friends f 
        JOIN users u ON f.user_id = u.id
        WHERE f.friend_id = ? AND f.status = 'pending'
      `).all(userId);
    },
    createPost(userId, text, kind, url) {
      const info = db.prepare("INSERT INTO posts (user_id, text, kind, url) VALUES (?, ?, ?, ?)").run(userId, text, kind, url);
      return { id: info.lastInsertRowid, user_id: userId, text, kind, url };
    },
    getPostsForUsers(userIds) {
      if (!userIds.length) return [];
      const placeholders = userIds.map(() => "?").join(",");
      const stmt = db.prepare(`
        SELECT p.id, p.text, p.kind, p.url, p.created_at, u.username AS author
        FROM posts p JOIN users u ON p.user_id = u.id
        WHERE p.user_id IN (${placeholders})
        ORDER BY p.created_at DESC
      `);
      return stmt.all(...userIds);
    },
    createMessage(fromId, toId, text) {
      const info = db.prepare("INSERT INTO messages (from_id, to_id, text) VALUES (?, ?, ?)").run(fromId, toId, text);
      return { id: info.lastInsertRowid, from_id: fromId, to_id: toId, text };
    },
    getMessagesForUser(userId) {
      return db.prepare(`
        SELECT m.id, m.text, m.created_at, uf.username AS "from", ut.username AS "to"
        FROM messages m
        JOIN users uf ON m.from_id = uf.id
        JOIN users ut ON m.to_id = ut.id
        WHERE m.to_id = ?
        ORDER BY m.created_at DESC
      `).all(userId);
    },
    getPostsForUser(userId) {
      return db.prepare(`
        SELECT p.id, p.text, p.kind, p.url, p.created_at, u.username AS author, u.id AS author_id
        FROM posts p JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `).all(userId);
    },
    createNotification(userId, type, content) {
      const stmt = db.prepare(`
        INSERT INTO notifications (user_id, type, content) VALUES (?, ?, ?)
      `);
      const info = stmt.run(userId, type, content);
      return { id: info.lastInsertRowid, type, content };
    },
    getNotifications(userId) {
      const stmt = db.prepare(`
        SELECT * FROM notifications WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 50
      `);
      return stmt.all(userId);
    },
    markNotificationAsRead(notificationId) {
      const stmt = db.prepare(`
        UPDATE notifications SET read = 1 WHERE id = ?
      `);
      stmt.run(notificationId);
    },
    markAllNotificationsAsRead(userId) {
      const stmt = db.prepare(`
        UPDATE notifications SET read = 1 WHERE user_id = ?
      `);
      stmt.run(userId);
    }
  };
}
