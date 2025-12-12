export function createUserManager(storage, eventBus) {
  return {
    register(username, password) {
      const exists = storage.getUserByUsername(username);
      if (exists) throw new Error("Utilisateur déjà existant");
      const user = storage.createUser(username, password);
      eventBus.publish("user.registered", { username });
      return user;
    },
    authenticate(username, password) {
      const user = storage.getUserByUsername(username);
      if (!user || user.password !== password) return null;
      eventBus.publish("user.authenticated", { username });
      return { id: user.id, username: user.username };
    },
    addFriend(requester, target) {
      const u1 = storage.getUserByUsername(requester);
      const u2 = storage.getUserByUsername(target);
      if (!u1 || !u2) throw new Error("Utilisateur introuvable");
      storage.addFriend(u1.id, u2.id);
      storage.addFriend(u2.id, u1.id);
      eventBus.publish("friend.added", { requester, target });
    },
    removeFriend(requester, target) {
      const u1 = storage.getUserByUsername(requester);
      const u2 = storage.getUserByUsername(target);
      if (!u1 || !u2) throw new Error("Utilisateur introuvable");
      storage.removeFriend(u1.id, u2.id);
      storage.removeFriend(u2.id, u1.id);
      eventBus.publish("friend.removed", { requester, target });
    },
    getFriends(username) {
      const user = storage.getUserByUsername(username);
      if (!user) throw new Error("Utilisateur introuvable");
      return storage.getFriends(user.id);
    }
  };
}
