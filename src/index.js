require("dotenv").config();
const { Client, IntentsBitField, EmbedBuilder, PermissionsBitField } = require("discord.js");
const chatID = "1268306951696289802";
const pingChat = "1295544141387927580";
const correctEmojiID = "1238948417938395166";
const incorrectEmojiID = "1238948281019666542";

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildPresences
    ]
});

let errorCount = 0;
let isBotOnline = true;

async function createThreadIfNeeded(message) {

    if (message.hasThread) {
        return;
    }

    const existingThreads = await message.channel.threads.fetchActive();
    const hasThread = existingThreads.threads.some(thread => thread.message && thread.message.id === message.id);

    if (!hasThread) {
        if (message.author.bot || message.type === 'THREAD_STARTER_MESSAGE') {
            await message.delete()
        } else if (message.attachments.size > 0) {
            const guild = message.guild
        
            const correctEmoji = await guild.emojis.fetch(correctEmojiID);
            const incorrectEmoji = await guild.emojis.fetch(incorrectEmojiID);

            await message.react(`${correctEmoji}`);
            await message.react(`${incorrectEmoji}`);

            try {
                await message.startThread({
                    name: `${message.author.username} post`,
                    autoArchiveDuration: 1440,
                    reason: '',
                });
            } catch (error) {
                console.error("Erro ao tentar criar um thread:", error);
            }
        } else {
            await message.delete();
            const sentMessage = await message.channel.send(`<@${message.author.id}> você não pode enviar mensagens sem arquivos nesse canal!`);
            setTimeout(() => {
                sentMessage.delete().catch(error => console.error("Erro ao tentar apagar a mensagem:", error));
            }, 15000);
        }
    } else {
        console.log(`Thread já existe para a mensagem: ${message.id}`);
    }
}

const sendStatusUpdate = async () => {
    const channel = await client.channels.fetch(pingChat);

    if (!channel) {
        console.error("Canal para envio de status não encontrado.");
        return;
    }

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const formattedUptime = `__**${hours}**h **${minutes}**m **${seconds}**s__`;

    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const formattedMemoryUsage = `${Math.round(memoryUsage * 100) / 100} MB`;

    const serverCount = client.guilds.cache.size;
    let moderatorsOnlineCount = 0;
    const members = await channel.guild.members.fetch();
    
    members.forEach(member => {
        if (!member.user.bot) {
            const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
            const hasStaffRole = member.roles.cache.some(role => role.name === "Staff Team");

            if ((isAdmin || hasStaffRole) && (member.presence?.status !== 'undefined')) {
                moderatorsOnlineCount++;
            }
        }
    });    

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('**Bot Status**')
        .addFields(
            { name: '🌐 Status', value: isBotOnline ? '✅ Online' : '❌ Offline', inline: true },
            { name: '🕒 Uptime', value: `${formattedUptime}\n`, inline: true },
            { name: '🏠 Servers count', value: `${serverCount}\n`, inline: true },
            { name: '👮 Staffs On-line', value: `${moderatorsOnlineCount}\n`, inline: true },
            { name: '💾 Memory use', value: `${formattedMemoryUsage}\n`, inline: true }               
        )
        .setTimestamp();

    await channel.send({ embeds: [embed] });
}

async function CheckChannelCriacoes() {
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
}


async function startStatusUpdates() {
    await sendStatusUpdate();
    setInterval(sendStatusUpdate, 3600000);
}

client.on("error", async (error) => {
    errorCount++;
    console.error("Erro no bot:", error);
});

// client.on("interactionCreate", (interaction) => {
//     if (!interaction.isChatInputCommand()) return;

//     if (interaction.name == 'status') {
//         interaction.reply("I'm on-line!")
//     }
// })

client.on("ready", (c) => {
    console.log(`✅ Bot ${client.user.tag} is online.`);
    
    CheckChannelCriacoes();
    startStatusUpdates();
});

client.login(process.env.TOKEN);