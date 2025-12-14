// Composant NotificationService — notifications basiques via EventBus
// FR: Simule des notifications (log + payloads)

export function createNotificationService(eventBus) {
  const notifications = {}; // En mémoire pour la démo

  return {
    /**
     * Notifie les amis d'un auteur qu'un nouveau post existe.
     * @param {string} authorUsername
     * @param {object} post
     */
    notifyFriendsNewPost(authorUsername, post) {
      eventBus.publish("notification.post", { author: authorUsername, postId: post.id });
    },

    /**
     * Notifie un utilisateur d'un nouveau message privé.
     * @param {string} recipientUsername
     * @param {object} message
     */
    notifyPrivateMessage(recipientUsername, message) {
      eventBus.publish("notification.message", { to: recipientUsername, msgId: message.id });
    },

    /**
     * Stocke une notification
     */
    addNotification(username, type, payload) {
      if (!notifications[username]) notifications[username] = [];
      notifications[username].push({
        id: Date.now(),
        type,
        payload,
        createdAt: new Date().toISOString(),
        read: false
      });
    },

    /**
     * Récupère les notifications d'un utilisateur
     */
    getNotifications(username) {
      return notifications[username] || [];
    },

    /**
     * Marque une notification comme lue
     */
    markAsRead(username, notificationId) {
      if (!notifications[username]) return;
      const notif = notifications[username].find(n => n.id === notificationId);
      if (notif) notif.read = true;
    }
  };
}
