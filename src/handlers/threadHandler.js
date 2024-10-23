const { correctEmojiID, incorrectEmojiID } = require('../config/IDs');

async function createThreadIfNeeded(message, client) {
    try {
        if (message.hasThread) return;

        const existingThreads = await message.channel.threads.fetchActive();
        const hasThread = existingThreads.threads.some(thread => thread.message && thread.message.id === message.id);

        if (!hasThread) {
            if (message.author.bot || message.type === 'THREAD_STARTER_MESSAGE') {
                await message.delete();
            } else if (message.attachments.size > 0) {
                const guild = message.guild;
                const correctEmoji = guild.emojis.cache.get(correctEmojiID);
                const incorrectEmoji = guild.emojis.cache.get(incorrectEmojiID);

                if (correctEmoji && incorrectEmoji) {
                    await message.react(correctEmoji);
                    await message.react(incorrectEmoji);

                    await message.startThread({
                        name: `${message.author.username} post`,
                        autoArchiveDuration: 1440,
                    });
                } else {
                    console.error("Erro: Emoji não encontrado!");
                }
            } else {
                await message.delete();
                const sentMessage = await message.channel.send(`<@${message.author.id}> você não pode enviar mensagens sem arquivos nesse canal!`);
                
                const timeout = setTimeout(() => {
                    sentMessage.delete().catch(error => console.log("Erro ao apagar a mensagem: ", error));
                }, 5000);

                client.on("messageDelete", (deletedMessage) => {
                    if (deletedMessage.author.id === sentMessage.author.id) {
                        clearTimeout(timeout);
                    }
                });
            }
        }
    } catch (error) {
        console.error("Erro ao tentar criar um thread:", error);
    }
}

module.exports = { createThreadIfNeeded };