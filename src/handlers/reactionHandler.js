const { starEmojiID, correctEmojiID, destaquesChatID } = require('../config/IDs');
const { countMentions } = require('../utils/countMentions');

async function handleReactionLogic(reaction, client) {
    const message = reaction.message;

    try {
        if (reaction.emoji.id === correctEmojiID && reaction.count >= 20 && !message.reactions.cache.has(starEmojiID)) {
            const destaquesChannel = await client.channels.fetch(destaquesChatID);
            if (destaquesChannel) {
                if (message.attachments.size > 0) {
                    const messageSend = await destaquesChannel.send({
                        content: `# <@${message.author.id}>\n\n> - ${message.content || "*Sem descrição*"}`,
                        files: message.attachments.map(attachment => ({ attachment: attachment.url, name: attachment.name }))
                    });

                    await message.react(starEmojiID);
                    await messageSend.react(starEmojiID);
                    
                    const member = await message.guild.members.fetch(message.author.id);
                    const mentionCount = await countMentions(message.author.id, destaquesChatID);
                    
                    let roleId;
                    switch (true) {
                        case (mentionCount >= 1 && mentionCount <= 4):
                            roleId = '1256153440325730324';
                            break;
                        case (mentionCount >= 5 && mentionCount <= 9):
                            roleId = '1297992077279498271';
                            break;
                        case (mentionCount >= 10):
                            roleId = '1297992125924769823';
                            break;
                    }

                    if (roleId) {
                        await member.roles.add(roleId);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erro ao manipular a reação:', error);
    }
}

module.exports = { handleReactionLogic };