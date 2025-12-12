function print(obj) {
  document.getElementById("out").textContent = JSON.stringify(obj, null, 2);
}
async function post(path, body) {
  const res = await fetch(`/api${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}
async function get(path) {
  const res = await fetch(`/api${path}`);
  return res.json();
}
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  print(await post("/login", { username, password }));
}
async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  print(await post("/register", { username, password }));
}
async function addFriend() {
  const requester = document.getElementById("username").value;
  const target = document.getElementById("friend").value;
  print(await post("/friends/add", { requester, target }));
}
async function removeFriend() {
  const requester = document.getElementById("username").value;
  const target = document.getElementById("friend").value;
  print(await post("/friends/remove", { requester, target }));
}
async function createPost() {
  const author = document.getElementById("username").value;
  const text = document.getElementById("postText").value;
  const kind = document.getElementById("postKind").value;
  const url = document.getElementById("postUrl").value || null;
  print(await post("/posts", { author, text, kind, url }));
}
async function loadFeed() {
  const username = document.getElementById("username").value;
  print(await get(`/feed/${encodeURIComponent(username)}`));
}
async function sendMessage() {
  const from = document.getElementById("username").value;
  const to = document.getElementById("msgTo").value;
  const text = document.getElementById("msgText").value;
  print(await post("/messages", { from, to, text }));
}
async function loadInbox() {
  const username = document.getElementById("username").value;
  print(await get(`/messages/${encodeURIComponent(username)}`));
}
