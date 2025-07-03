require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const ROLES = ['Monster', 'Warrior', 'Healer'];
const rooms = {};

function assignRolesIfNeeded(room) {
  const nonHosts = room.clients.filter(c => !c.isHost);
  const unassigned = nonHosts.filter(c => !c.role);
  const alreadyAssigned = nonHosts.filter(c => c.role && ROLES.includes(c.role));
  const rolesToAssign = ROLES.filter(r => !alreadyAssigned.some(c => c.role === r));
  if (rolesToAssign.length > 0 && nonHosts.length >= 3) {
    const shuffled = unassigned.sort(() => Math.random() - 0.5);
    rolesToAssign.forEach((role, i) => {
      if (shuffled[i]) shuffled[i].role = role;
    });
    for (let i = rolesToAssign.length; i < shuffled.length; i++) {
      shuffled[i].role = 'Villager';
    }
  }
  unassigned.forEach(c => {
    if (!c.role) c.role = 'Villager';
  });
}

function sendRolesToAll(room) {
  room.clients.forEach(client => {
    client.send(JSON.stringify({
      type: 'role',
      role: client.role,
      isHost: client.isHost,
      name: client.name
    }));
  });
  if (room.host) {
    const allRoles = room.clients.filter(c => !c.isHost).map(c => ({ name: c.name, role: c.role, id: c.id }));
    room.host.send(JSON.stringify({ type: 'all_roles', allRoles }));
  }
}

wss.on('connection', (ws) => {
  ws.isHost = false;
  ws.role = null;
  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }
    if (data.type === 'check_host') {
      const room = rooms[data.roomId];
      ws.send(JSON.stringify({ type: 'host_status', hostExists: !!(room && room.host) }));
      return;
    }
    if (data.type === 'create_room') {
      const { roomId, name } = data;
      ws.id = Math.random().toString(36).substr(2, 9);
      ws.name = name;
      ws.isHost = true;
      ws.role = null;
      if (!rooms[roomId]) rooms[roomId] = { clients: [], host: null };
      const room = rooms[roomId];
      if (room.host) {
        ws.send(JSON.stringify({ type: 'host_status', hostExists: true }));
        return;
      }
      room.clients.push(ws);
      room.host = ws;
      assignRolesIfNeeded(room);
      sendRolesToAll(room);
      return;
    }
    if (data.type === 'join') {
      const { roomId, name } = data;
      ws.id = Math.random().toString(36).substr(2, 9);
      ws.name = name;
      ws.isHost = false;
      ws.role = null;
      if (!rooms[roomId]) rooms[roomId] = { clients: [], host: null };
      const room = rooms[roomId];
      room.clients.push(ws);
      if (!room.host && room.clients.length === 1) room.host = ws;
      assignRolesIfNeeded(room);
      sendRolesToAll(room);
      return;
    }
    if (data.type === 'msg') {
      const { roomId, text } = data;
      const room = rooms[roomId];
      if (!room) return;
      if (room.host) {
        room.host.send(JSON.stringify({ type: 'msg', from: ws.name, text, role: ws.role }));
      }
      room.clients.forEach(client => {
        if (client !== room.host && !client.isHost) {
          client.send(JSON.stringify({ type: 'msg', from: ws.name, text }));
        }
      });
      return;
    }
    if (data.type === 'host_private_msg') {
      const { roomId, toPlayerId, text } = data;
      const room = rooms[roomId];
      if (!room || ws !== room.host) return;
      const target = room.clients.find(c => c.id === toPlayerId && !c.isHost);
      if (target) {
        target.send(JSON.stringify({ type: 'private_msg', from: 'Host', text }));
        room.host.send(JSON.stringify({ type: 'private_msg', from: 'Host', to: target.name, text }));
      }
      return;
    }
    if (data.type === 'role_private_msg') {
      const { roomId, text } = data;
      const room = rooms[roomId];
      if (!room) return;
      const role = ws.role;
      if (["Monster", "Warrior", "Healer"].includes(role)) {
        if (room.host) {
          room.host.send(JSON.stringify({ type: 'private_msg', from: ws.name, role, text }));
        }
        ws.send(JSON.stringify({ type: 'private_msg', from: ws.name, to: 'Host', text }));
      }
      return;
    }
    if (data.type === 'reset_game') {
      const { roomId } = data;
      const room = rooms[roomId];
      if (!room || ws !== room.host) return;
      // Clear all non-host roles
      room.clients.forEach(c => { if (!c.isHost) c.role = null; });
      // Reassign roles only to non-hosts
      assignRolesIfNeeded(room);
      // Notify all clients to clear chats and update roles
      room.clients.forEach(client => {
        if (!client.isHost) {
          client.send(JSON.stringify({ type: 'reset_game', newRole: client.role }));
        } else {
          client.send(JSON.stringify({ type: 'reset_game' }));
        }
      });
      // Also update roles display for all
      sendRolesToAll(room);
      return;
    }
  });
  ws.on('close', () => {
    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      room.clients = room.clients.filter(c => c !== ws);
      if (room.host === ws) room.host = room.clients[0] || null;
      if (room.clients.length === 0) delete rooms[roomId];
      else sendRolesToAll(room);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});