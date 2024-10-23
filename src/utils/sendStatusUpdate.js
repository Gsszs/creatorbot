const { EmbedBuilder } = require("discord.js");
const { pingChat } = require('../config/IDs');

async function sendStatusUpdate(client) {
    const channel = await client.channels.fetch(pingChat);
    if (!channel) {
        console.error("Canal para envio de status não encontrado.");
        return;
    }

    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const formattedUptime = `__**${days}**d **${hours}**h **${minutes}**m **${seconds}**s__`;

    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const formattedMemoryUsage = `${Math.round(memoryUsage * 100) / 100} MB`;

    const serverCount = client.guilds.cache.size;
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`**Bot Status - ${client.user.tag}**`)
        .addFields(
            { name: '🌐 Status', value: 'Online', inline: false },
            { name: '🕒 Uptime', value: `${formattedUptime}\n`, inline: false },
            { name: '🏠 Servers count', value: `${serverCount}\n`, inline: false },
            { name: '💾 Memory Usage', value: `${formattedMemoryUsage}\n`, inline: false },
        )
        .setTimestamp();

    await channel.send({ embeds: [embed] });
}

module.exports = { sendStatusUpdate };