#!/usr/bin/env bash
set -e
BASE="http://localhost:3000"

echo "== Inscription de dave =="
curl -s -X POST "$BASE/api/register" -H "Content-Type: application/json" -d "{\"username\":\"dave\",\"password\":\"password\"}"

echo "== Login dave =="
curl -s -X POST "$BASE/api/login" -H "Content-Type: application/json" -d "{\"username\":\"dave\",\"password\":\"password\"}"

echo "== dave ajoute alice comme amie =="
curl -s -X POST "$BASE/api/friends/add" -H "Content-Type: application/json" -d "{\"requester\":\"dave\",\"target\":\"alice\"}"

echo "== dave publie un post texte =="
curl -s -X POST "$BASE/api/posts" -H "Content-Type: application/json" -d "{\"author\":\"dave\",\"text\":\"Hello world !\"}"

echo "== alice publie un lien =="
curl -s -X POST "$BASE/api/posts" -H "Content-Type: application/json" -d "{\"author\":\"alice\",\"text\":\"Lien utile\",\"kind\":\"link\",\"url\":\"https://example.com\"}"

echo "== Fil de dave (incluant amis) =="
curl -s "$BASE/api/feed/dave"

echo "== dave envoie un message privé à alice =="
curl -s -X POST "$BASE/api/messages" -H "Content-Type: application/json" -d "{\"from\":\"dave\",\"to\":\"alice\",\"text\":\"Salut Alice !\"}"

echo "== Inbox de alice =="
curl -s "$BASE/api/messages/alice"
