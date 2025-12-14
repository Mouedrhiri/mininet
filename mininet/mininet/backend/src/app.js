// MiniNet backend  point d'entrée Express (FR)
import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

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

const eventBus = createEventBus();
const storage = createStorage(path.join(__dirname, "../data/mininet.db"));
const notificationService = createNotificationService(eventBus);
const userManager = createUserManager(storage, eventBus);
const postManager = createPostManager(storage, eventBus, notificationService);
const messageService = createMessageService(storage, eventBus, notificationService);
const rest = createRestConnector(app);

// Endpoints REST
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

rest.register("POST", "/api/posts", (req, res) => {
  const { author, text, kind, url } = req.body;
  try {
    const post = postManager.createPost(author, text, kind, url);
    res.json({ ok: true, post });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
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

// Frontend statique
app.use("/", express.static(path.join(__dirname, "../../frontend/static")));

// Logs EventBus pour démo
eventBus.subscribe("post.created", p => console.log("[EventBus] post.created", p));
eventBus.subscribe("message.sent", p => console.log("[EventBus] message.sent", p));
eventBus.subscribe("friend.added", p => console.log("[EventBus] friend.added", p));

const PORT = 3000;
app.listen(PORT, () => console.log(`MiniNet backend démarré sur http://localhost:${PORT}`));
