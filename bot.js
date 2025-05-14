import Discord from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

// Express app for health checks
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    lastChecked: new Date().toISOString(),
    botStatus: client?.user?.tag ? 'connected' : 'disconnected',
    serverStatus: state.lastServerStatus ? 'online' : 'offline',
    maintenanceMode: state.isUnderMaintenance
  });
});

app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

// Bot configuration
const config = {
  token: process.env.DISCORD_TOKEN,
  serverIP: process.env.SERVER_IP,
  channelID: process.env.CHANNEL_ID,
  allowedRoleID: process.env.ALLOWED_ROLE_ID,
  adminRoleID: process.env.ADMIN_ROLE_ID,
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 60000, // 1 minute
  stateFile: './bot_state.json'
};

// State management
let state = {
  isUnderMaintenance: false,
  lastServerStatus: null,
  lastAnnouncement: 0
};

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent
  ]
});

// Immediate announcement on status change
async function handleStatusChange(isOnline) {
  const now = Date.now();
  
  if (state.isUnderMaintenance) return;

  if (isOnline && state.lastServerStatus === false) {
    await sendAnnouncement(`🎉 **Server Back Online** 🎉\n\nThe server has completed its restart and is now online!\n\n<@&${config.allowedRoleID}>`);
  } 
  else if (!isOnline && state.lastServerStatus === true) {
    await sendAnnouncement(`🔧 **Scheduled Restart** 🔧\n\nThe server is undergoing a scheduled restart. It should be back online shortly.\n\n<@&${config.allowedRoleID}>`);
  }
  
  state.lastServerStatus = isOnline;
  state.lastAnnouncement = now;
}

// Enhanced server status check
async function checkServerStatus() {
  try {
    const response = await fetch(`http://${config.serverIP}/dynamic.json`);
    const data = await response.json();
    const isOnline = data && data.players !== undefined;

    if (state.lastServerStatus !== isOnline) {
      await handleStatusChange(isOnline);
    }
  } catch (error) {
    console.error('Status check failed:', error);
    if (state.lastServerStatus !== false) {
      await handleStatusChange(false);
    }
  }
}

// Message handlers (same as before)
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  setInterval(checkServerStatus, config.checkInterval);
  checkServerStatus();
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const member = await message.guild.members.fetch(message.author.id).catch(() => null);
  if (!member || !member.roles.cache.has(config.adminRoleID)) return;

  if (message.content.startsWith('!maintenance')) {
    // ... (same maintenance commands as before)
  }
});

// Start the bot
client.login(config.token);