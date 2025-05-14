# GTA RP Server Status Discord Bot

![Discord Bot](https://img.shields.io/badge/Discord-Bot-blue?logo=discord)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)

A Discord bot that monitors your GTA RP server status and sends announcements to a designated channel when the server status changes or when maintenance is performed.

## Features

- **Real-time Server Monitoring**: Checks server status via `/dynamic.json` endpoint
- **Maintenance Mode**: Admins can manually set maintenance status
- **Automatic Announcements**: Notifies when server comes online/offline
- **Role Tagging**: Mentions your Allowlist role in announcements
- **Test Mode**: Simulate server status changes for testing

## Prerequisites

- Node.js v18 or higher
- Discord bot token
- Access to your server's `/dynamic.json` endpoint

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gtarp-status-bot.git
cd gtarp-status-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration:
```env
DISCORD_TOKEN=your_bot_token_here
SERVER_IP=your.server.ip
CHANNEL_ID=your_announcement_channel_id
ALLOWED_ROLE_ID=your_allowlist_role_id
ADMIN_ROLE_ID=your_admin_role_id
# Optional:
CHECK_INTERVAL=300000 # 5 minutes in ms
TEST_MODE=true # Set to false for production
```

## Usage

### Running the Bot
```bash
node bot.js
```

### Commands

**Admin Commands:**
- `!maintenance on [reason]` - Enable maintenance mode
- `!maintenance off [reason]` - Disable maintenance mode

**Test Commands (when TEST_MODE=true):**
- `!test online` - Simulate server online status
- `!test offline` - Simulate server offline status
- `!test toggle` - Toggle between online/offline states

## Configuration

| Environment Variable | Description | Required |
|----------------------|-------------|----------|
| `DISCORD_TOKEN` | Your Discord bot token | Yes |
| `SERVER_IP` | Your server IP (without http://) | Yes |
| `CHANNEL_ID` | Channel ID for announcements | Yes |
| `ALLOWED_ROLE_ID` | Role ID to mention in announcements | Yes |
| `ADMIN_ROLE_ID` | Role ID for admin commands | Yes |
| `CHECK_INTERVAL` | Status check interval in ms (default: 300000) | No |
| `TEST_MODE` | Enable test mode (true/false) | No |

## Bot Permissions

The bot requires the following permissions:
- Send Messages
- View Channels
- Mention @everyone, @here, and All Roles
- Read Message History (for command processing)

## Deployment

For production deployment:
1. Set `TEST_MODE=false` in your `.env` file
2. Consider using a process manager like PM2:
```bash
npm install -g pm2
pm2 start bot.js --name "status-bot"
pm2 save
pm2 startup
```

## Contributing

Contributions are welcome! Please open an issue or pull request for any improvements.

## License

This project is licensed under the MIT License.