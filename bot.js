import Discord from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const config = {
    token: process.env.DISCORD_TOKEN,
    serverIP: process.env.SERVER_IP || 'your-server-ip',
    channelID: process.env.CHANNEL_ID || 'your-channel-id',
    allowedRoleID: process.env.ALLOWED_ROLE_ID || 'your-allowlist-role-id',
    adminRoleID: process.env.ADMIN_ROLE_ID || 'your-admin-role-id',
    checkInterval: process.env.CHECK_INTERVAL || 20000, // 5 minutes in ms
    testMode: process.env.TEST_MODE === 'true' // Enable test mode
};

// Bot state
let isUnderMaintenance = false;
let lastServerStatus = null;
let testServerStatus = true; // Default test status (online)

// Create Discord client
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent
    ]
});

// Ready event
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Test mode: ${config.testMode ? 'ON' : 'OFF'}`);
    
    // Start checking server status
    setInterval(checkServerStatus, config.checkInterval);
    checkServerStatus(); // Initial check
});

// Message handler for admin commands
client.on('messageCreate', async message => {
    // Ignore messages from bots or not in guild
    if (message.author.bot || !message.guild) return;

    // Check if user has admin role
    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (!member || !member.roles.cache.has(config.adminRoleID)) return;

    // Process commands
    if (message.content.startsWith('!maintenance')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return message.reply('Usage: !maintenance <on|off> [reason]');
        }

        const action = args[1].toLowerCase();
        const reason = args.slice(2).join(' ') || 'No reason provided';

        if (action === 'on') {
            isUnderMaintenance = true;
            await sendAnnouncement(`🚧 **Server Maintenance** 🚧\n\nThe server is now under maintenance. ${reason}\n\n<@&${config.allowedRoleID}>`);
            await message.reply('Maintenance mode activated and announcement sent.');
        } else if (action === 'off') {
            isUnderMaintenance = false;
            await sendAnnouncement(`✅ **Maintenance Complete** ✅\n\nThe server maintenance has been completed. The server should be online now!\n\n<@&${config.allowedRoleID}>`);
            await message.reply('Maintenance mode deactivated and announcement sent.');
        } else {
            await message.reply('Invalid action. Use "on" or "off".');
        }
    }

    // Test commands (only work in test mode)
    if (config.testMode && message.content.startsWith('!test')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return message.reply('Test commands:\n!test online - Simulate server online\n!test offline - Simulate server offline\n!test toggle - Toggle server status');
        }

        const action = args[1].toLowerCase();
        
        if (action === 'online') {
            testServerStatus = true;
            await message.reply('Test mode: Simulating server ONLINE status');
            await checkServerStatus();
        } else if (action === 'offline') {
            testServerStatus = false;
            await message.reply('Test mode: Simulating server OFFLINE status');
            await checkServerStatus();
        } else if (action === 'toggle') {
            testServerStatus = !testServerStatus;
            await message.reply(`Test mode: Toggled server status to ${testServerStatus ? 'ONLINE' : 'OFFLINE'}`);
            await checkServerStatus();
        } else {
            await message.reply('Invalid test command. Use "online", "offline", or "toggle"');
        }
    }
});

// Function to check server status
async function checkServerStatus() {
    try {
        let isOnline;
        
        if (config.testMode) {
            // Use test status in test mode
            isOnline = testServerStatus;
            console.log(`[TEST] Server status check: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
        } else {
            // Actual server check
            const response = await fetch(`http://${config.serverIP}/dynamic.json`);
            const data = await response.json();
            isOnline = data && data.players !== undefined;
        }
        
        // If server was offline and now is online (and not in maintenance)
        if (lastServerStatus === false && isOnline && !isUnderMaintenance) {
            await sendAnnouncement(`🎉 **Server Online** 🎉\n\nThe server is now back online!\n\n<@&${config.allowedRoleID}>`);
        }
        
        // If server was online and now is offline (and not in maintenance)
        if (lastServerStatus === true && !isOnline && !isUnderMaintenance) {
            await sendAnnouncement(`⚠️ **Server Offline** ⚠️\n\nThe server appears to be offline. We're looking into it.\n\n<@&${config.allowedRoleID}>`);
        }
        
        lastServerStatus = isOnline;
    } catch (error) {
        console.error('Error checking server status:', error);
        
        // If we can't reach the server (and not in maintenance)
        if (lastServerStatus !== false && !isUnderMaintenance) {
            await sendAnnouncement(`⚠️ **Server Offline** ⚠️\n\nThe server appears to be offline. We're looking into it.\n\n<@&${config.allowedRoleID}>`);
        }
        
        lastServerStatus = false;
    }
}

// Function to send announcements
async function sendAnnouncement(message) {
    try {
        const channel = await client.channels.fetch(config.channelID);
        await channel.send(message);
        console.log('Announcement sent:', message);
    } catch (error) {
        console.error('Error sending announcement:', error);
    }
}

// Login to Discord
client.login(config.token);