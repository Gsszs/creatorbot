require("dotenv").config();
const { Client, IntentsBitField, EmbedBuilder } = require("discord.js");
const { chatID, pingChat, correctEmojiID, incorrectEmojiID, destaquesChatID, criacoesChatID, starEmojiID } = require("./IDs");

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildPresences
    ]
});

let isBotOnline = true;

async function createThreadIfNeeded(message) {
    try {
        if (message.hasThread) {
            return;
        }

        const existingThreads = await message.channel.threads.fetchActive();
        const hasThread = existingThreads.threads.some(thread => thread.message && thread.message.id === message.id);

        if (!hasThread) {
            if (message.author.bot || message.type === 'THREAD_STARTER_MESSAGE') {
                await message.delete();
            } else if (message.attachments.size > 0) {
                const guild = message.guild;

                const correctEmoji = await guild.emojis.fetch(correctEmojiID);
                const incorrectEmoji = await guild.emojis.fetch(incorrectEmojiID);

                await message.react(correctEmoji);
                await message.react(incorrectEmoji);

                await message.startThread({
                    name: `${message.author.username} post`,
                    autoArchiveDuration: 1440,
                    reason: '',
                });
            } else {
                await message.delete();
                const sentMessage = await message.channel.send(`<@${message.author.id}> você não pode enviar mensagens sem arquivos nesse canal!`);

                const timeout = setTimeout(() => {
                    sentMessage.delete().catch(error => console.log("Erro ao apagar a mensagem: ", error));
                }, 5000);

                client.on("messageDelete", (message) => {
                    if (message.author.id == sentMessage.author.id) {
                        console.log("Mensagem deletada por outro usuário, cancelando timeout");
                        clearTimeout(timeout);
                    }
                });
            }
        } else {
            console.log(`Thread já existe para a mensagem: ${message.id}`);
        }
    } catch (error) {
        console.error("Erro ao tentar criar um thread:", error);
    }
}

const sendStatusUpdate = async () => {
    try {
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
            .setTitle(`**Bot Status - 1.2 (beta)**`)
            .addFields(
                { name: '🌐 Status', value: isBotOnline ? `Online` : `Offline`, inline: false },
                { name: '🕒 Uptime', value: `${formattedUptime}\n`, inline: false },
                { name: '🏠 Servers count', value: `${serverCount}\n`, inline: false },
                { name: '💾 Memory use', value: `${formattedMemoryUsage}\n`, inline: false }
            )
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao enviar atualização de status:", error);
    }
};

async function CheckChannelCriacoes() {
    try {
        const channel = await client.channels.fetch(chatID);
        const messages = await channel.messages.fetch({ limit: 100 });

        for (const message of messages.values()) {
            if (message.author.id === client.user.id || message.channelId !== chatID) continue;
            await createThreadIfNeeded(message);
        }

        client.on("messageCreate", async (message) => {
            if (message.author.id === client.user.id || message.channelId !== chatID) return;
            await createThreadIfNeeded(message);
        });
    } catch (error) {
        console.error("Erro ao verificar o canal de criações:", error);
    }
}

async function startStatusUpdates() {
    await sendStatusUpdate();
    setInterval(sendStatusUpdate, 3600000);
}

async function countMentions(userId, channelId) {
    try {
        const channel = await client.channels.fetch(channelId);
        const messages = await channel.messages.fetch({ limit: 100 });
        let mentionCount = 0;

        messages.forEach(message => {
            if (message.mentions.has(userId)) {
                mentionCount++;
            }
        });

        return mentionCount;
    } catch (error) {
        console.error("Erro ao contar menções:", error);
    }
}

async function handleReaction(reaction) {
    try {
        const message = reaction.message;
        const guild = message.guild;

        // Verifica se os emojis existem
        let correctEmoji;
        let incorrectEmoji;
        let starEmoji;

        try {
            correctEmoji = await guild.emojis.fetch(correctEmojiID);
            incorrectEmoji = await guild.emojis.fetch(incorrectEmojiID);
            starEmoji = await guild.emojis.fetch(starEmojiID);
        } catch (error) {
            console.error("Erro ao buscar os emojis: ", error);
        }

        // Define o emoji de estrela padrão caso não exista
        const starEmojiToUse = starEmoji || '⭐️';

        // Verifica se a reação é o correctEmoji e se possui 20 ou mais reações
        if (reaction.emoji.id === correctEmojiID && reaction.count >= 20) {

            // Verifica se a mensagem já tem o emoji de estrela ou mais de 2 reações
            const reactions = message.reactions.cache;
            const hasStarEmoji = reactions.some(r => r.emoji.id === starEmojiID || r.emoji.name === '⭐️');
            const totalReactions = reactions.size;

            if (!hasStarEmoji && totalReactions <= 2) {

                const destaquesChannel = await client.channels.fetch(destaquesChatID);

                try {
                    await message.fetch();
                } catch (error) {
                    console.error("A mensagem não foi encontrada ou foi deletada.", error);
                    return;
                }

                if (destaquesChannel) {
                    if (message.attachments.size > 0) {
                        await destaquesChannel.send({
                            content: `# <@${message.author.id}>\n\n> - ${message.content || "*Sem descrição*"}`,
                            files: message.attachments.map(attachment => ({
                                attachment: attachment.url,
                                name: attachment.name
                            }))
                        });

                        await message.react(starEmojiToUse); // Reage com o emoji encontrado ou o padrão ⭐️

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
                            default:
                                roleId = null;
                        }

                        if (roleId) {
                            try {
                                await member.roles.add(roleId);
                            } catch (error) {
                                console.error(`Erro ao adicionar cargo: ${error}`);
                            }
                        }
                    }
                }
            } else {
                console.log(`A mensagem já tem o emoji de estrela ou mais de 2 reações. Reações na mensagem:`);
                reactions.forEach(reaction => {
                    console.log(`Emoji: ${reaction.emoji.name}, ID: ${reaction.emoji.id}`);
                });
            }
        }
    } catch (error) {
        console.error("Erro ao tratar a reação:", error);
    }
}

client.on("ready", (c) => {
    console.log(`✅ Bot ${client.user.tag} is online.`);
    CheckChannelCriacoes();
    startStatusUpdates();
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.message.channelId === criacoesChatID) {
        await handleReaction(reaction);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.message.channelId === criacoesChatID) {
        await handleReaction(reaction);
    }
});

client.login(process.env.TOKEN);