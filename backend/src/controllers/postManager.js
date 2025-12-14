export function createPostManager(storage, eventBus, notificationService) {
  return {
    createPost(author, text, kind = "text", url = null) {
      const user = storage.getUserByUsername(author);
      if (!user) throw new Error("Auteur introuvable");
      const post = storage.createPost(user.id, text, kind, url);
      eventBus.publish("post.created", { id: post.id, author, kind, url });
      notificationService.notifyFriendsNewPost(author, post);
      return post;
    },
    getFeedForUser(username) {
      const user = storage.getUserByUsername(username);
      if (!user) throw new Error("Utilisateur introuvable");
      const friendIds = storage.getFriends(user.id).map(f => f.id);
      return storage.getPostsForUsers([user.id, ...friendIds]);
    }
  };
}
