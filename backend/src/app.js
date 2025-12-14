// MiniNet backend — point d'entrée Express avec upload (FR)
import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";

import { createEventBus } from "./connectors/eventBus.js";
import { createRestConnector } from "./connectors/restConnector.js";

import { createStorage } from "./storage/storage.js";
import { createUserManager } from "./controllers/userManager.js";
import { createPostManager } from "./controllers/postManager.js";
import { createMessageService } from "./controllers/messageService.js";
import { createNotificationService } from "./controllers/notificationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Configuration Multer
const uploadsDir = path.join(__dirname, '../data/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Créer dossier uploads s'il n'existe pas
const uploadsDirPublic = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadsDirPublic)) {
  fs.mkdirSync(uploadsDirPublic, { recursive: true });
}

// Servir les uploads depuis le dossier data/uploads
app.use("/uploads", express.static(path.join(__dirname, "../data/uploads")));

const eventBus = createEventBus();
const storageDB = createStorage(path.join(__dirname, "../data/mininet.db"));
const notificationService = createNotificationService(eventBus);
const userManager = createUserManager(storageDB, eventBus);
const postManager = createPostManager(storageDB, eventBus, notificationService);
const messageService = createMessageService(storageDB, eventBus, notificationService);
const rest = createRestConnector(app);

// ============ ENDPOINTS AUTHENTIFICATION ============

rest.register("POST", "/api/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Paramètres manquants" });
  try {
    const user = userManager.register(username, password);
    res.json({ ok: true, user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

rest.register("POST", "/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = userManager.authenticate(username, password);
  if (!user) return res.status(401).json({ error: "Authentification échouée" });
  res.json({ ok: true, user });
});

// ============ ENDPOINTS AMIS ============

rest.register("POST", "/api/friends/add", (req, res) => {
  const { requester, target } = req.body;
  try {
    userManager.addFriend(requester, target);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

rest.register("POST", "/api/friends/remove", (req, res) => {
  const { requester, target } = req.body;
  try {
    userManager.removeFriend(requester, target);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

rest.register("GET", "/api/friends/:username", (req, res) => {
  const { username } = req.params;
  try {
    const friends = userManager.getFriends(username);
    res.json({ ok: true, friends });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

rest.register("GET", "/api/users/:username", (req, res) => {
  const { username } = req.params;
  const user = storageDB.getUserByUsername(username);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
  res.json({ ok: true, user: { id: user.id, username: user.username } });
});

// ============ ENDPOINTS POSTS ============

rest.register("POST", "/api/posts", (req, res) => {
  const { author, text, kind, url } = req.body;
  try {
    const post = postManager.createPost(author, text, kind, url);
    res.json({ ok: true, post });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Upload d'image
rest.register('POST', '/api/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ ok: true, imageUrl });
  });
});

rest.register("GET", "/api/feed/:username", (req, res) => {
  const { username } = req.params;
  try {
    const feed = postManager.getFeedForUser(username);
    res.json({ ok: true, feed });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

rest.register("GET", "/api/posts/:username", (req, res) => {
  const { username } = req.params;
  try {
    const user = storageDB.getUserByUsername(username);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    const posts = storageDB.getPostsForUser(user.id);
    res.json({ ok: true, posts });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ============ ENDPOINTS MESSAGES ============

rest.register("POST", "/api/messages", (req, res) => {
  const { from, to, text } = req.body;
  try {
    const msg = messageService.sendMessage(from, to, text);
    res.json({ ok: true, message: msg });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

rest.register("GET", "/api/messages/:username", (req, res) => {
  const { username } = req.params;
  try {
    const inbox = messageService.getInbox(username);
    res.json({ ok: true, inbox });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ============ ENDPOINTS NOTIFICATIONS ============

rest.register("GET", "/api/notifications/:username", (req, res) => {
  const { username } = req.params;
  try {
    const notifications = notificationService.getNotifications(username);
    res.json({ ok: true, notifications });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ============ FRONTEND STATIQUE ============

app.use("/", express.static(path.join(__dirname, "../../frontend/static")));

// ============ LOGS EVENTBUS ============

eventBus.subscribe("post.created", p => console.log("[EventBus] post.created", p));
eventBus.subscribe("message.sent", p => console.log("[EventBus] message.sent", p));
eventBus.subscribe("friend.added", p => console.log("[EventBus] friend.added", p));
eventBus.subscribe("notification.post", p => console.log("[EventBus] notification.post", p));

const PORT = 3000;
app.listen(PORT, () => console.log(`MiniNet backend démarré sur http://localhost:${PORT}`));