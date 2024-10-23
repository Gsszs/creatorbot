require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const { checkChannelCriacoes, startStatusUpdates } = require('./src/events/ready');
const { handleReaction } = require('./src/events/messageReactionAdd');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildEmojisAndStickers,
    ]
});

client.on("ready", (c) => {
    console.log(`✅ Bot ${client.user.tag} is online.`);
    checkChannelCriacoes(client);
    startStatusUpdates(client);
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (!user.bot) {
        handleReaction(reaction, client);
    }
});

client.login(process.env.TOKEN);
