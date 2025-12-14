import path from "path";
import { fileURLToPath } from "url";
import { createStorage } from "./src/storage/storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = createStorage(path.join(__dirname, "./data/mininet.db"));

function seed() {
  const users = [
    "alice",
    "bob",
    "carla",
    "moha@univ-nantes.fr",
    "bennounameryem@abhs.com"
  ];
  
  for (const u of users) {
    if (!storage.getUserByUsername(u)) {
      storage.createUser(u, "password");
      console.log(`Utilisateur créé: ${u}`);
    }
  }

  // Amis initiaux avec acceptation
  const alice = storage.getUserByUsername("alice");
  const bob = storage.getUserByUsername("bob");
  const moha = storage.getUserByUsername("moha@univ-nantes.fr");
  const bennou = storage.getUserByUsername("bennounameryem@abhs.com");
  
  if (alice && bob) {
    storage.addFriend(alice.id, bob.id);
    storage.addFriend(bob.id, alice.id);
    storage.acceptFriend(alice.id, bob.id);
  }
  
  if (moha && bennou) {
    storage.addFriend(moha.id, bennou.id);
    storage.acceptFriend(moha.id, bennou.id);
  }

  // Posts init
  if (moha) {
    storage.createPost(moha.id, "Bonjour MiniNet !", "text", null);
  }
}

seed();
console.log("Base initialisée: backend/data/mininet.db");
