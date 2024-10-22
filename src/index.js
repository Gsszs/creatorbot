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

async function handleReaction(reaction, user) {
    console.log("Iniciando handleReaction...");

    // Verifica se a reação foi adicionada por um bot
    if (user.bot) {
        console.log("Reação ignorada pois foi feita por um bot.");
        return;
    }

    const message = reaction.message;
    const guild = message.guild;

    // Verifica se os IDs de emojis estão definidos corretamente
    console.log("Correct Emoji ID:", correctEmojiID || "não definido");
    console.log("Incorrect Emoji ID:", incorrectEmojiID || "não definido");
    console.log("Star Emoji ID:", starEmojiID || "não definido");

    // Variáveis para os emojis
    let correctEmoji, incorrectEmoji, starEmoji;

    console.log("Buscando emojis no servidor...");

    try {
        correctEmoji = await guild.emojis.fetch(correctEmojiID);
        incorrectEmoji = await guild.emojis.fetch(incorrectEmojiID);
        starEmoji = await guild.emojis.fetch(starEmojiID);

        console.log("Emojis carregados com sucesso.");
        console.log("Correct Emoji:", correctEmoji ? correctEmoji.toString() : "não encontrado");
        console.log("Incorrect Emoji:", incorrectEmoji ? incorrectEmoji.toString() : "não encontrado");
        console.log("Star Emoji:", starEmoji ? starEmoji.toString() : "não encontrado");
    } catch (fetchError) {
        console.error("Erro ao buscar os emojis:", fetchError);
        return;  // Sai da função se falhar ao buscar os emojis
    }

    // Usa o emoji padrão de estrela se o customizado não for encontrado
    const starEmojiToUse = starEmoji ? starEmoji : '⭐️';
    console.log("Emoji de estrela a ser usado:", starEmojiToUse);

    // Lógica de verificação para o emoji correto
    console.log("Verificando se a reação é o correctEmoji e possui 20 ou mais reações.");
    if (reaction.emoji.id === correctEmojiID && reaction.count >= 20) {
        console.log("A reação é o correctEmoji e possui 20 ou mais reações.");
        
        try {
            // Reage com o emoji de estrela
            await message.react(starEmojiToUse);
            console.log("Reagiu com o emoji de estrela:", starEmojiToUse);
        } catch (reactError) {
            console.error("Erro ao reagir com o emoji de estrela:", reactError);
        }
    } else {
        console.log("A reação não é o correctEmoji ou não possui 20 reações.");
    }

    // Lógica de verificação para o emoji incorreto
    console.log("Verificando se a reação é o incorrectEmoji.");
    if (reaction.emoji.id === incorrectEmojiID) {
        console.log("A reação é o incorrectEmoji.");
        
        try {
            // Aqui entra a lógica de tratar a reação do emoji incorrect
            await message.reply("A resposta foi marcada como incorreta!");
            console.log("Resposta marcada como incorreta.");
        } catch (replyError) {
            console.error("Erro ao responder com 'incorreta':", replyError);
        }
    } else {
        console.log("A reação não é o incorrectEmoji.");
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