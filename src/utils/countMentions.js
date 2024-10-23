async function countMentions(userId, channelId) {
    const channel = await client.channels.fetch(channelId);
    const messages = await channel.messages.fetch({ limit: 100 });

    let mentionCount = 0;
    for (const message of messages.values()) {
        if (message.content.includes(`<@${userId}>`)) {
            mentionCount++;
        }
    }

    return mentionCount;
}

module.exports = { countMentions };