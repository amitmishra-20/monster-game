// Minimal, robust client.js for Monster Room Game
let ws;
let roomId = '';
let isHost = false;
let myRole = '';
let myName = '';
let allRoles = [];

function showSection(id) {
  ['landing-section', 'host-create-section', 'join-section', 'game-section'].forEach(sec => {
    const el = document.getElementById(sec);
    if (el) el.style.display = 'none';
  });
  const showEl = document.getElementById(id);
  if (showEl) showEl.style.display = '';
}

function getRoomIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

window.onload = () => {
  const urlRoomId = getRoomIdFromUrl();
  if (urlRoomId) {
    showSection('join-section');
    const joinRoomInput = document.getElementById('join-room-id');
    if (joinRoomInput) joinRoomInput.value = urlRoomId;
  } else {
    showSection('landing-section');
  }
  updateResetButtonVisibility();
};

document.getElementById('start-create-btn').onclick = () => {
  showSection('host-create-section');
  updateResetButtonVisibility();
};

document.getElementById('final-create-btn').onclick = () => {
  const name = document.getElementById('host-name').value.trim();
  if (!name) return alert('Enter your name');
  myName = name;
  roomId = Math.random().toString(36).substr(2, 8);
  connectWS(name, roomId, true, true);
  showSection('game-section');
  const roomName = document.getElementById('room-name');
  if (roomName) roomName.textContent = roomId;
  const connectingMsg = document.getElementById('connecting-msg');
  if (connectingMsg) connectingMsg.style.display = '';
  const hostBadge = document.getElementById('host-badge');
  if (hostBadge) hostBadge.textContent = '';
  const privateChatSection = document.getElementById('private-chat-section');
  if (privateChatSection) privateChatSection.style.display = 'none';
  updateResetButtonVisibility();
};

document.getElementById('join-btn').onclick = () => {
  const name = document.getElementById('name').value.trim();
  const joinId = document.getElementById('join-room-id').value.trim();
  if (!name) return alert('Enter your name');
  if (!joinId) return alert('Enter room ID');
  myName = name;
  roomId = joinId;
  connectWS(name, roomId, false, false);
  showSection('game-section');
  const roomName = document.getElementById('room-name');
  if (roomName) roomName.textContent = roomId;
  const connectingMsg = document.getElementById('connecting-msg');
  if (connectingMsg) connectingMsg.style.display = '';
  const hostBadge = document.getElementById('host-badge');
  if (hostBadge) hostBadge.textContent = '';
  const privateChatSection = document.getElementById('private-chat-section');
  if (privateChatSection) privateChatSection.style.display = 'none';
  updateResetButtonVisibility();
};

function connectWS(name, roomId, asHost = false, createRoom = false) {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${location.hostname}:3000`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: createRoom ? 'create_room' : 'join', roomId, name, asHost }));
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'role') {
      const connectingMsg = document.getElementById('connecting-msg');
      if (connectingMsg) connectingMsg.style.display = 'none';
      isHost = data.isHost;
      myRole = data.role;
      myName = data.name;
      const hostBadge = document.getElementById('host-badge');
      if (isHost) {
        if (hostBadge) hostBadge.textContent = myName + ' (Host)';
      } else if (myRole) {
        if (hostBadge) hostBadge.textContent = myName + ' (' + myRole + ')';
      } else {
        if (hostBadge) hostBadge.textContent = myName;
      }
      const privateChatSection = document.getElementById('private-chat-section');
      const privatePlayerSelect = document.getElementById('private-player-select');
      if (isHost || ["Monster", "Warrior", "Healer"].includes(myRole)) {
        if (privateChatSection) privateChatSection.style.display = '';
        if (isHost) {
          if (privatePlayerSelect) privatePlayerSelect.style.display = '';
        } else {
          if (privatePlayerSelect) privatePlayerSelect.style.display = 'none';
        }
      } else {
        if (privateChatSection) privateChatSection.style.display = 'none';
      }
      updateResetButtonVisibility();
    } else if (data.type === 'all_roles') {
      allRoles = data.allRoles;
      const playerListSection = document.getElementById('player-list-section');
      const playerList = document.getElementById('player-list');
      if (isHost) {
        const select = document.getElementById('private-player-select');
        if (select) {
          data.allRoles.forEach(r => {
            if (["Monster", "Warrior", "Healer"].includes(r.role)) {
              const opt = document.createElement('option');
              opt.value = r.id;
              opt.textContent = `${r.name} (${r.role})`;
              select.appendChild(opt);
            }
          });
        }
        if (playerListSection && playerList) {
          playerListSection.style.display = '';
          playerList.innerHTML = '';
          const hostLi = document.createElement('li');
          hostLi.textContent = myName + ' (Host)';
          playerList.appendChild(hostLi);
          data.allRoles.forEach(r => {
            const li = document.createElement('li');
            li.textContent = `${r.name} (${r.role})`;
            playerList.appendChild(li);
          });
        }
      } else {
        if (playerListSection) playerListSection.style.display = 'none';
      }
    } else if (data.type === 'msg') {
      const div = document.getElementById('messages');
      if (div) {
        const msg = document.createElement('div');
        msg.innerHTML = `<b>${data.from}:</b> ${data.text}`;
        div.appendChild(msg);
        div.scrollTop = div.scrollHeight;
      }
    } else if (data.type === 'private_msg') {
      const div = document.getElementById('private-messages');
      if (div) {
        const msg = document.createElement('div');
        let label = '';
        if (isHost) {
          if (data.from === 'Host') {
            label = `<span style='color:purple;'>(Private to ${data.to})</span> `;
          } else {
            label = `<span style='color:purple;'>(Private from ${data.from})</span> `;
          }
        } else if (["Monster", "Warrior", "Healer"].includes(myRole)) {
          if (data.from === 'Host') {
            label = `<span style='color:purple;'>(Private from Host)</span> `;
          } else {
            label = `<span style='color:purple;'>(Private to Host)</span> `;
          }
        }
        msg.innerHTML = `${label}${data.text}`;
        div.appendChild(msg);
        div.scrollTop = div.scrollHeight;
      }
    } else if (data.type === 'reset_game') {
      // Clear chat and private messages for everyone
      const messages = document.getElementById('messages');
      if (messages) messages.innerHTML = '';
      const privateMessages = document.getElementById('private-messages');
      if (privateMessages) privateMessages.innerHTML = '';
      // Optionally clear input fields
      const msgInput = document.getElementById('msg-input');
      if (msgInput) msgInput.value = '';
      const privateMsgInput = document.getElementById('private-msg-input');
      if (privateMsgInput) privateMsgInput.value = '';
      // If not host, update role if provided
      if (!isHost && data.newRole) {
        myRole = data.newRole;
        const hostBadge = document.getElementById('host-badge');
        if (hostBadge) hostBadge.textContent = myName + ' (' + myRole + ')';
      }
      updateResetButtonVisibility();
    }
  };
  ws.onclose = () => {
    alert('Connection lost. Please refresh and rejoin.');
  };
}

document.getElementById('send-btn').onclick = () => {
  const input = document.getElementById('msg-input');
  const text = input ? input.value.trim() : '';
  if (!text || !ws || ws.readyState !== 1) return;
  ws.send(JSON.stringify({ type: 'msg', roomId, text }));
  if (input) input.value = '';
};

document.getElementById('msg-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('send-btn').click();
});

document.getElementById('send-private-btn').onclick = () => {
  const privatePlayerSelect = document.getElementById('private-player-select');
  const toPlayerId = privatePlayerSelect ? privatePlayerSelect.value : '';
  const text = (document.getElementById('private-msg-input') || {}).value?.trim() || '';
  if (isHost) {
    if (!toPlayerId || !text || !ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({ type: 'host_private_msg', roomId, toPlayerId, text }));
    const input = document.getElementById('private-msg-input');
    if (input) input.value = '';
  } else if (["Monster", "Warrior", "Healer"].includes(myRole)) {
    if (!text || !ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({ type: 'role_private_msg', roomId, text }));
    const input = document.getElementById('private-msg-input');
    if (input) input.value = '';
  }
};

document.getElementById('private-msg-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('send-private-btn').click();
});

const shareBtn = document.getElementById('side-share-link-btn');
if (shareBtn) {
  shareBtn.onclick = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    const msg = document.getElementById('side-share-link-msg');
    if (msg) {
      msg.textContent = 'Link copied!';
      setTimeout(() => { msg.textContent = ''; }, 2000);
    }
  };
}

const ROLES = ['Monster', 'Warrior', 'Healer'];
function assignRoles(clients) {
  // Exclude host from role assignment
  const players = clients.filter(c => !c.isHost);
  const shuffled = players.slice().sort(() => Math.random() - 0.5);
  const roles = {};
  shuffled.forEach((client, i) => {
    if (i < ROLES.length) roles[client.id] = ROLES[i];
    else roles[client.id] = 'Villager';
  });
  return roles;
}

function assignRolesIfNeeded(room) {
  const nonHosts = room.clients.filter(c => !c.isHost);
  const unassigned = nonHosts.filter(c => !c.role);
  const alreadyAssigned = nonHosts.filter(c => c.role && ROLES.includes(c.role));
  const rolesToAssign = ROLES.filter(r => !alreadyAssigned.some(c => c.role === r));
  if (rolesToAssign.length > 0 && nonHosts.length >= 3) {
    // Shuffle unassigned players
    const shuffled = unassigned.sort(() => Math.random() - 0.5);
    rolesToAssign.forEach((role, i) => {
      if (shuffled[i]) shuffled[i].role = role;
    });
    // Any remaining unassigned get Villager
    for (let i = rolesToAssign.length; i < shuffled.length; i++) {
      shuffled[i].role = 'Villager';
    }
  }
  // Any new joiners after all special roles are assigned get Villager
  unassigned.forEach(c => {
    if (!c.role) c.role = 'Villager';
  });
}

const resetBtn = document.getElementById('reset-game-btn');
if (resetBtn) {
  resetBtn.onclick = () => {
    if (isHost && ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'reset_game', roomId }));
    }
    // Clear chat and private messages for everyone
    const messages = document.getElementById('messages');
    if (messages) messages.innerHTML = '';
    const privateMessages = document.getElementById('private-messages');
    if (privateMessages) privateMessages.innerHTML = '';
    // Optionally clear input fields
    const msgInput = document.getElementById('msg-input');
    if (msgInput) msgInput.value = '';
    const privateMsgInput = document.getElementById('private-msg-input');
    if (privateMsgInput) privateMsgInput.value = '';
    updateResetButtonVisibility();
  };
}

function updateResetButtonVisibility() {
  const resetBtn = document.getElementById('reset-game-btn');
  if (resetBtn) {
    resetBtn.style.display = isHost ? '' : 'none';
  }
}