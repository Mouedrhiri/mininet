let currentUser = null;
let selectedConversation = null;

document.addEventListener('DOMContentLoaded', () => {
  const session = localStorage.getItem('userSession');
  if (session) {
    currentUser = JSON.parse(session);
    showPage('feed');
    loadFeed();
    loadFriends();
    loadMessages();
    // Charger les notifs une seule fois au démarrage
    updateNotificationBadge();
  } else {
    showPage('auth');
  }
});

function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById('navbar').style.display = pageName === 'auth' ? 'none' : 'block';
  document.getElementById(pageName + 'Page').classList.remove('hidden');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  const btnIndex = tab === 'login' ? 0 : 1;
  document.querySelectorAll('.tab-btn')[btnIndex].classList.add('active');
  document.getElementById(tab + 'Form').classList.remove('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const res = await api.login(username, password);
  if (res.ok) {
    currentUser = res.user;
    localStorage.setItem('userSession', JSON.stringify(currentUser));
    showPage('feed');
    loadFeed();
    loadFriends();
    loadMessages();
    // Charger les notifs une seule fois au démarrage
    updateNotificationBadge();
  } else {
    document.getElementById('loginError').textContent = res.error || 'Erreur';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  const password2 = document.getElementById('registerPassword2').value;
  if (password !== password2) {
    document.getElementById('registerError').textContent = 'Les mots de passe ne correspondent pas';
    return;
  }
  const res = await api.register(username, password);
  if (res.ok) {
    alert('Inscription réussie ! Connectez-vous maintenant.');
    switchAuthTab('login');
  } else {
    document.getElementById('registerError').textContent = res.error || 'Erreur';
  }
}

function logout() {
  localStorage.removeItem('userSession');
  currentUser = null;
  showPage('auth');
  document.getElementById('loginForm').reset();
  document.getElementById('registerForm').reset();
  switchAuthTab('login');
}

function updatePostTypeOptions() {
  const type = document.getElementById('postType').value;
  document.getElementById('postUrl').style.display = type === 'link' ? 'block' : 'none';
  document.getElementById('postImage').style.display = type === 'image' ? 'block' : 'none';
}

async function handleCreatePost(e) {
  e.preventDefault();
  const text = document.getElementById('postText').value;
  const type = document.getElementById('postType').value;
  let url = null;

  if (type === 'link') {
    url = document.getElementById('postUrl').value;
  } else if (type === 'image') {
    const file = document.getElementById('postImage').files[0];
    if (file) {
      const uploadRes = await api.uploadImage(file);
      if (uploadRes.ok) {
        url = uploadRes.imageUrl;
      } else {
        alert('Erreur lors de l\'upload');
        return;
      }
    }
  }

  const res = await api.createPost(currentUser.username, text, type, url);
  if (res.ok) {
    document.getElementById('postForm').reset();
    updatePostTypeOptions();
    await loadFeed();
  } else {
    alert(res.error || 'Erreur');
  }
}

async function loadFeed() {
  const res = await api.getFeed(currentUser.username);
  if (res.ok && res.feed) {
    const feedEl = document.getElementById('feedPosts');
    feedEl.innerHTML = '';
    res.feed.forEach(post => {
      const postEl = document.createElement('div');
      postEl.className = 'post';
      let content = `
        <div class="post-header">
          <div class="post-author">
            <div class="post-avatar"></div>
            <div class="post-author-info">
              <div class="post-author-name" onclick="showUserProfile('${post.author}')">${escapeHtml(post.author)}</div>
              <div class="post-time">${new Date(post.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>
        </div>
        <div class="post-body">
          <div class="post-text">${escapeHtml(post.text)}</div>
      `;
      if (post.kind === 'image' && post.url) {
        content += `<img src="${post.url}" class="post-image" alt="Image">`;
      } else if (post.kind === 'link' && post.url) {
        content += `<a href="${post.url}" target="_blank" class="post-link"> ${escapeHtml(post.url)}</a>`;
      }
      content += `</div>`;
      postEl.innerHTML = content;
      feedEl.appendChild(postEl);
    });
  }
}

async function loadFriends() {
  const res = await api.getFriends(currentUser.username);
  if (res.ok && res.friends) {
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '';
    res.friends.forEach(friend => {
      const friendEl = document.createElement('div');
      friendEl.className = 'friend-item';
      friendEl.innerHTML = `
        <span class="friend-name">${escapeHtml(friend.username)}</span>
        <div class="friend-actions">
          <button onclick="removeFriendAction('${friend.username}')">Retirer</button>
          <button onclick="goToConversation('${friend.username}')">Message</button>
        </div>
      `;
      friendsList.appendChild(friendEl);
    });
  }
}

function showAddFriendModal() {
  document.getElementById('addFriendModal').classList.remove('hidden');
}

function closeAddFriendModal() {
  document.getElementById('addFriendModal').classList.add('hidden');
}

async function handleAddFriend(e) {
  e.preventDefault();
  const targetUsername = document.getElementById('addFriendUsername').value;
  const res = await api.addFriend(currentUser.username, targetUsername);
  if (res.ok) {
    alert('Ami ajouté !');
    closeAddFriendModal();
    await loadFriends();
    document.getElementById('addFriendUsername').value = '';
  } else {
    document.getElementById('addFriendError').textContent = res.error || 'Erreur';
  }
}

async function removeFriendAction(username) {
  const res = await api.removeFriend(currentUser.username, username);
  if (res.ok) {
    await loadFriends();
  } else {
    alert(res.error || 'Erreur');
  }
}

function showUserProfile(username) {
  document.getElementById('viewProfileContent').innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 1rem;"></div>
      <h3>${escapeHtml(username)}</h3>
      <button class="btn btn-primary" onclick="goToConversation('${username}')" style="margin-right:0.5rem;">Envoyer un message</button>
      <button class="btn btn-secondary" onclick="addFriendDirect('${username}')">Ajouter en ami</button>
    </div>
  `;
  document.getElementById('viewProfileModal').classList.remove('hidden');
}

function closeViewProfileModal() {
  document.getElementById('viewProfileModal').classList.add('hidden');
}

function addFriendDirect(username) {
  document.getElementById('addFriendUsername').value = username;
  handleAddFriend({ preventDefault: () => {} });
  closeViewProfileModal();
}

async function loadMessages() {
  const res = await api.getInbox(currentUser.username);
  if (res.ok && res.inbox) {
    const conversationsEl = document.getElementById('conversationsList');
    const uniqueUsers = [...new Set(res.inbox.map(m => m["from"] === currentUser.username ? m["to"] : m["from"]))];
    conversationsEl.innerHTML = '';
    uniqueUsers.forEach(user => {
      const convEl = document.createElement('div');
      convEl.className = 'conversation-item';
      convEl.textContent = escapeHtml(user);
      convEl.onclick = () => startConversation(user);
      conversationsEl.appendChild(convEl);
    });
  }
}

function goToConversation(withUser) {
  closeViewProfileModal();
  showPage('messages');
  selectedConversation = withUser;
  document.getElementById('noConversation').style.display = 'none';
  document.getElementById('messageForm').style.display = 'flex';
  document.getElementById('messageThread').style.display = 'block';
  document.getElementById('messageThread').innerHTML = '<p style="text-align:center; color:#999;">Conversation avec ' + escapeHtml(withUser) + '</p>';
  loadConversation(withUser);
}

function startConversation(withUser) {
  selectedConversation = withUser;
  document.getElementById('noConversation').style.display = 'none';
  document.getElementById('messageForm').style.display = 'flex';
  document.getElementById('messageThread').style.display = 'block';
  document.getElementById('messageThread').innerHTML = '';
  loadConversation(withUser);
}

async function loadConversation(withUser) {
  const res = await api.getInbox(currentUser.username);
  if (res.ok && res.inbox) {
    const threadEl = document.getElementById('messageThread');
    threadEl.innerHTML = '';
    const filteredMessages = res.inbox.filter(msg => msg["from"] === withUser || msg["to"] === withUser);
    filteredMessages.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = 'message';
      const isFrom = msg["from"] === currentUser.username;
      msgEl.innerHTML = `
        <div class="message-item ${isFrom ? 'message-to' : 'message-from'}">
          ${escapeHtml(msg.text)}
        </div>
      `;
      threadEl.appendChild(msgEl);
    });
    threadEl.scrollTop = threadEl.scrollHeight;
  }
}

async function handleSendMessage(e) {
  e.preventDefault();
  const text = document.getElementById('messageText').value;
  if (!text.trim()) return;
  const res = await api.sendMessage(currentUser.username, selectedConversation, text);
  if (res.ok) {
    document.getElementById('messageText').value = '';
    await loadConversation(selectedConversation);
    await loadMessages();
  } else {
    alert(res.error || 'Erreur');
  }
}

async function showNotifications() {
  showPage('notifications');
  const notifsList = document.getElementById('notificationsList');
  notifsList.innerHTML = '<p>Chargement...</p>';
  
  // Charger les demandes d'amis
  const requestsRes = await api.getPendingRequests(currentUser.username);
  let html = '';
  
  if (requestsRes.ok && requestsRes.requests && requestsRes.requests.length > 0) {
    html += requestsRes.requests.map(req => `
      <div class="notification unread" style="border-left-color:#405de6;">
        <div class="notification-type">👥 Demande d'ami</div>
        <div class="notification-content">${escapeHtml(req.username)} vous demande d'être ami</div>
        <div style="margin-top:0.75rem; display:flex; gap:0.5rem;">
          <button class="btn btn-primary" onclick="acceptFriendRequest('${req.username}')" style="flex:1; padding:0.5rem;">Accepter</button>
          <button class="btn btn-secondary" onclick="rejectFriendRequest('${req.username}')" style="flex:1; padding:0.5rem;">Refuser</button>
        </div>
      </div>
    `).join('');
  }
  
  // Charger les autres notifications
  const notifRes = await api.getNotifications(currentUser.username);
  if (notifRes.ok && notifRes.notifications && notifRes.notifications.length > 0) {
    html += notifRes.notifications.map(notif => `
      <div class="notification ${notif.read ? '' : 'unread'}">
        <div class="notification-type">${notif.type === 'friend_request' ? '👥 Ami' : notif.type === 'new_post' ? '📝 Post' : '💬 Message'}</div>
        <div class="notification-content">${escapeHtml(notif.content)}</div>
        <div style="font-size:0.85rem; color:#999;">${new Date(notif.created_at).toLocaleString('fr-FR')}</div>
      </div>
    `).join('');
  }
  
  if (!html) {
    html = '<p style="color:#999;">Aucune notification</p>';
  }
  
  notifsList.innerHTML = html;
}

// Remplacez updateNotificationBadge() pour ne pas faire de requêtes répétées :
async function updateNotificationBadge() {
  const requestsRes = await api.getPendingRequests(currentUser.username);
  const unreadCount = (requestsRes.requests ? requestsRes.requests.length : 0);
  
  const badge = document.getElementById('notifBadge');
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// Remplacez acceptFriendRequest() pour actualiser après :
async function acceptFriendRequest(username) {
  const res = await api.acceptFriend(username, currentUser.username);
  if (res.ok) {
    alert('Ami accepté !');
    await loadFriends();
    await updateNotificationBadge();
    await showNotifications(); // Rafraîchir les notifs
  } else {
    alert(res.error || 'Erreur');
  }
}

// Et rejectFriendRequest() :
async function rejectFriendRequest(username) {
  const res = await api.rejectFriend(username, currentUser.username);
  if (res.ok) {
    await updateNotificationBadge();
    await showNotifications(); // Rafraîchir les notifs
  } else {
    alert(res.error || 'Erreur');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadProfilePage() {
  document.getElementById('profileUsername').textContent = currentUser.username;
  
  // Charger les amis et demandes
  const friendsRes = await api.getFriends(currentUser.username);
  const requestsRes = await api.getPendingRequests(currentUser.username);
  
  let stats = '';
  if (friendsRes.ok) stats += `${friendsRes.friends ? friendsRes.friends.length : 0} amis`;
  if (requestsRes.ok && requestsRes.requests && requestsRes.requests.length > 0) {
    stats += ` • ${requestsRes.requests.length} demande(s)`;
  }
  document.getElementById('profileStats').textContent = stats;
  
  // Charger les posts de l'utilisateur
  const res = await api.getFeed(currentUser.username);
  if (res.ok && res.feed) {
    const userPostsEl = document.getElementById('userPosts');
    userPostsEl.innerHTML = '';
    const userPosts = res.feed.filter(p => p.author === currentUser.username);
    if (userPosts.length === 0) {
      userPostsEl.innerHTML = '<p style="color:#999;">Aucun post</p>';
      return;
    }
    userPosts.forEach(post => {
      const postEl = document.createElement('div');
      postEl.className = 'post';
      let content = `
        <div class="post-header">
          <div class="post-author">
            <div class="post-avatar">👤</div>
            <div class="post-author-info">
              <div class="post-author-name">${escapeHtml(post.author)}</div>
              <div class="post-time">${new Date(post.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>
        </div>
        <div class="post-body">
          <div class="post-text">${escapeHtml(post.text)}</div>
      `;
      if (post.kind === 'image' && post.url) {
        content += `<img src="${post.url}" class="post-image" alt="Image">`;
      } else if (post.kind === 'link' && post.url) {
        content += `<a href="${post.url}" target="_blank" class="post-link">🔗 ${escapeHtml(post.url)}</a>`;
      }
      content += `</div>`;
      postEl.innerHTML = content;
      userPostsEl.appendChild(postEl);
    });
  }
}

function goToProfile() {
  showPage('profile');
  loadProfilePage();
}

async function loadFriendRequests() {
  const res = await api.getPendingRequests(currentUser.username);
  if (res.ok && res.requests) {
    const notifsList = document.getElementById('notificationsList');
    const requestsHtml = res.requests.map(req => `
      <div class="notification unread" style="border-left-color:#405de6;">
        <div class="notification-type">👥 Demande d'ami</div>
        <div class="notification-content">${escapeHtml(req.username)} vous demande d'être ami</div>
        <div style="margin-top:0.75rem; display:flex; gap:0.5rem;">
          <button class="btn btn-primary" onclick="acceptFriendRequest('${req.username}')" style="flex:1; padding:0.5rem;">Accepter</button>
          <button class="btn btn-secondary" onclick="rejectFriendRequest('${req.username}')" style="flex:1; padding:0.5rem;">Refuser</button>
        </div>
      </div>
    `).join('');
    
    // Afficher les demandes + autres notifications
    const otherNotifs = document.getElementById('notificationsList').innerHTML || '';
    document.getElementById('notificationsList').innerHTML = requestsHtml + otherNotifs;
  }
}

async function acceptFriendRequest(username) {
  const res = await api.acceptFriend(username, currentUser.username);
  if (res.ok) {
    alert('Ami accepté !');
    await loadFriends();
    await updateNotificationBadge();
    await showNotifications(); // Rafraîchir les notifs
  } else {
    alert(res.error || 'Erreur');
  }
}

async function rejectFriendRequest(username) {
  const res = await api.rejectFriend(username, currentUser.username);
  if (res.ok) {
    await updateNotificationBadge();
    await showNotifications(); // Rafraîchir les notifs
  } else {
    alert(res.error || 'Erreur');
  }
}
