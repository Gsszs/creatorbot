const { sendStatusUpdate } = require('../utils/sendStatusUpdate');
const { createThreadIfNeeded } = require('../handlers/threadHandler');
const { criacoesChatID } = require('../config/IDs');

async function checkChannelCriacoes(client) {
    const channel = await client.channels.fetch(criacoesChatID);
    const messages = await channel.messages.fetch();

    for (const message of messages.values()) {
        if (message.author.id === client.user.id || message.channelId !== criacoesChatID) continue;
        await createThreadIfNeeded(message, client);
    }

    client.on("messageCreate", async (message) => {
        if (message.author.id === client.user.id || message.channelId !== criacoesChatID) return;
        await createThreadIfNeeded(message, client);
    });
}

async function startStatusUpdates(client) {
    await sendStatusUpdate(client);
    setInterval(() => sendStatusUpdate(client), 3600000);
}

module.exports = { checkChannelCriacoes, startStatusUpdates };
