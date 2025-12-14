export function createNotificationService(eventBus) {
  return {
    notifyFriendsNewPost(authorUsername, post) {
      eventBus.publish("notification.post", { author: authorUsername, postId: post.id });
    },
    notifyPrivateMessage(recipientUsername, message) {
      eventBus.publish("notification.message", { to: recipientUsername, msgId: message.id });
    }
  };
}
