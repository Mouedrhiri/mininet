const API_BASE = 'http://localhost:3000/api';
class MiniNetAPI {
  async register(username, password) {
    return fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(r => r.json());
  }
  async login(username, password) {
    return fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(r => r.json());
  }
  async createPost(author, text, kind = 'text', url = null) {
    return fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text, kind, url })
    }).then(r => r.json());
  }
  async getFeed(username) {
    return fetch(`${API_BASE}/feed/${username}`).then(r => r.json());
  }
  async getFriends(username) {
    return fetch(`${API_BASE}/friends/${username}`).then(r => r.json());
  }
  async addFriend(requester, target) {
    return fetch(`${API_BASE}/friends/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester, target })
    }).then(r => r.json());
  }
  async removeFriend(requester, target) {
    return fetch(`${API_BASE}/friends/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester, target })
    }).then(r => r.json());
  }
  async sendMessage(from, to, text) {
    return fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, text })
    }).then(r => r.json());
  }
  async getInbox(username) {
    return fetch(`${API_BASE}/messages/${username}`).then(r => r.json());
  }
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
  }
}
const api = new MiniNetAPI();
