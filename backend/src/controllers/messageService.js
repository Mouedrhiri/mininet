export function createMessageService(storage, eventBus, notificationService) {
  return {
    sendMessage(from, to, text) {
      const uFrom = storage.getUserByUsername(from);
      const uTo = storage.getUserByUsername(to);
      if (!uFrom || !uTo) throw new Error("Expéditeur ou destinataire introuvable");
      const message = storage.createMessage(uFrom.id, uTo.id, text);
      eventBus.publish("message.sent", { from, to, id: message.id });
      notificationService.notifyPrivateMessage(to, message);
      return message;
    },
    getInbox(username) {
      const user = storage.getUserByUsername(username);
      if (!user) throw new Error("Utilisateur introuvable");
      return storage.getMessagesForUser(user.id);
    }
  };
}
