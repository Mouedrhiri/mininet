import path from "path";
import { fileURLToPath } from "url";
import { createStorage } from "./src/storage/storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = createStorage(path.join(__dirname, "./data/mininet.db"));

function seed() {
  const users = ["alice", "bob", "carla"];
  for (const u of users) {
    if (!storage.getUserByUsername(u)) {
      storage.createUser(u, "password");
      console.log(`Utilisateur créé: ${u}`);
    }
  }
  const alice = storage.getUserByUsername("alice");
  const bob = storage.getUserByUsername("bob");
  storage.addFriend(alice.id, bob.id);
  storage.addFriend(bob.id, alice.id);
  storage.createPost(alice.id, "Bonjour MiniNet !", "text", null);
  storage.createPost(bob.id, "Regardez ceci", "link", "https://example.com");
}
seed();
console.log("Base initialisée: backend/data/mininet.db");
