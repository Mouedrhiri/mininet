// Application MiniNet - Logique principale

let currentUser = null;
let notifications = [];
let friends = [];
let selectedConversation = null;

// === Initialisation ===
document.addEventListener('DOMContentLoaded', () => {
  const session = localStorage.getItem('userSession');
  if (session) {
    currentUser = JSON.parse(session);
    showPage('feed');
    loadFeed();
    loadFriends();
    loadNotifications();
    setInterval(loadNotifications, 30000); // Rafraîchir notifs toutes les 30s
  } else {
    showPage('auth');
  }
});

// === Pages ===
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  
  if (pageName === 'auth') {
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('navbar').style.display = 'none';
  } else {
    document.getElementById('navbar').style.display = 'block';
    document.getElementById(pageName + 'Page').classList.remove('hidden');
  }
}

// === Auth ===
function switchAuthTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  
  if (tab === 'login') {
    document.querySelector('[onclick="switchAuthTab(\'login\')"]').classList.add('active');
    document.getElementById('loginForm').classList.remove('hidden');
  } else {
    document.querySelector('[onclick="switchAuthTab(\'register\')"]').classList.add('active');
    document.getElementById('registerForm').classList.remove('hidden');
  }
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
    loadNotifications();
    setInterval(loadNotifications, 30000);
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

// === Feed ===
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
    await loadNotifications();
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
            <div class="post-avatar">👤</div>
            <div class="post-author-info">
              <div class="post-author-name" onclick="showUserProfile('${post.author}')">${post.author}</div>
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
        content += `<a href="${post.url}" target="_blank" class="post-link">🔗 Lien: ${post.url}</a>`;
      }
      
      content += `</div>`;
      postEl.innerHTML = content;
      feedEl.appendChild(postEl);
    });
  }
}

// === Friends ===
async function loadFriends() {
  const res = await api.getFeed(currentUser.username);
  // Pour récupérer les amis, on aurait besoin d'un endpoint dédié
  // Pour l'instant, simuler une liste (à adapter avec un vrai endpoint)
  const friendsList = document.getElementById('friendsList');
  friendsList.innerHTML = '<p style="font-size:0.9rem; color:#999;">Amis à charger...</p>';
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
  } else {
    document.getElementById('addFriendError').textContent = res.error || 'Erreur';
  }
}

// === Profile ===
function showUserProfile(username) {
  document.getElementById('viewProfileContent').innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">👤</div>
      <h3>${username}</h3>
      <button class="btn btn-primary" onclick="startConversation('${username}')">Envoyer un message</button>
      <button class="btn btn-secondary" onclick="addFriendDirect('${username}')">Ajouter en ami</button>
    </div>
  `;
  document.getElementById('viewProfileModal').classList.remove('hidden');
}

function closeViewProfileModal() {
  document.getElementById('viewProfileModal').classList.add('hidden');
}

// === Messages ===
function startConversation(withUser) {
  selectedConversation = withUser;
  document.getElementById('messageThread').innerHTML = `<p style="text-align:center; color:#999;">Conversation avec ${withUser}</p>`;
  document.getElementById('noConversation').style.display = 'none';
  document.getElementById('messageForm').style.display = 'flex';
  document.getElementById('messageThread').style.display = 'block';
  loadConversation(withUser);
}

async function loadConversation(withUser) {
  const res = await api.getInbox(currentUser.username);
  if (res.ok && res.inbox) {
    const threadEl = document.getElementById('messageThread');
    threadEl.innerHTML = '';
    
    res.inbox.filter(msg => msg.from === withUser || msg.to === withUser).forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = 'message';
      const isFrom = msg.from === currentUser.username;
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
  const res = await api.sendMessage(currentUser.username, selectedConversation, text);
  if (res.ok) {
    document.getElementById('messageText').value = '';
    await loadConversation(selectedConversation);
    await loadNotifications();
  } else {
    alert(res.error || 'Erreur');
  }
}

async function loadMessages() {
  const res = await api.getInbox(currentUser.username);
  if (res.ok && res.inbox) {
    const conversationsEl = document.getElementById('conversationsList');
    const uniqueUsers = [...new Set(res.inbox.map(m => m.from === currentUser.username ? m.to : m.from))];
    
    conversationsEl.innerHTML = '';
    uniqueUsers.forEach(user => {
      const convEl = document.createElement('div');
      convEl.className = 'conversation-item';
      convEl.textContent = user;
      convEl.onclick = () => startConversation(user);
      conversationsEl.appendChild(convEl);
    });
  }
}

// === Notifications ===
async function loadNotifications() {
  // Simuler les notifications (à adapter avec un vrai système)
  const res = await api.getFeed(currentUser.username);
  // Ici, on pourrait tracker les nouveaux posts/messages
  updateNotificationBadge();
}

function showNotifications() {
  showPage('notifications');
  displayNotifications();
}

function displayNotifications() {
  const notifsList = document.getElementById('notificationsList');
  notifsList.innerHTML = `<p style="color:#999;">Aucune notification</p>`;
  // À adapter avec un vrai système de notifs
}

function updateNotificationBadge() {
  const badge = document.getElementById('notifBadge');
  // À adapter avec le vrai compteur
  badge.style.display = 'none';
}

function markAllNotificationsRead() {
  alert('Marqué comme lu');
}

function addFriendDirect(username) {
  handleAddFriend({ preventDefault: () => {
    document.getElementById('addFriendUsername').value = username;
  }});
  closeViewProfileModal();
}

// === Utilitaires ===
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Servir index.html pour la racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/static/index.html"));
});

// Frontend statique
app.use("/", express.static(path.join(__dirname, "../../frontend/static")));