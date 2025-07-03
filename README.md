# Monster Game

A multiplayer role-based monster game built with Node.js, Express, and WebSocket.

## Features

- Multiplayer gameplay with role-based mechanics
- Real-time communication via WebSocket
- Role assignment system (Monster, Warrior, Healer, Villager)
- Private messaging between players and host
- Game reset functionality

## Installation

1. Clone the repository:
```bash
git clone https://github.com/amitmishra-20/monster-game.git
cd monster-game
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp env.example .env

# Edit .env file with your preferred settings
```

4. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port number |
| `MAX_PLAYERS_PER_ROOM` | `10` | Maximum players per game room |
| `GAME_TIMEOUT` | `300000` | Game timeout in milliseconds |
| `NODE_ENV` | `development` | Environment mode |
| `DEBUG` | `true` | Enable debug logging |

Example `.env` file:
```env
PORT=3000
MAX_PLAYERS_PER_ROOM=10
GAME_TIMEOUT=300000
NODE_ENV=development
DEBUG=true
```

## Game Rules

1. **Host**: Creates and manages the game room
2. **Monster**: Special role with unique abilities
3. **Warrior**: Protector role
4. **Healer**: Support role
5. **Villager**: Regular player role

## How to Play

1. Open the game in your browser at `http://localhost:3000`
2. Create a room or join an existing one
3. Wait for role assignment
4. Communicate with other players
5. Use private messaging for strategic communication

## Technologies Used

- **Backend**: Node.js, Express.js
- **Real-time Communication**: WebSocket (ws)
- **Environment Management**: dotenv
- **Frontend**: HTML, CSS, JavaScript

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Author

Amit Mishra - [GitHub](https://github.com/amitmishra-20) 