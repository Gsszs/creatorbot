require("dotenv").config();
const { EmbedBuilder } = require("discord.js");
const { reactionRoleChat } = require("./IDs")

const channel = reactionRoleChat;

async function SendEmbedRegister() {
    if (!channel) return;

    const messages = await channel.messages.fetch();

    if (messages.size < 1) {
        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('**Teste embed**')
            .addFields(
                { name: 'Teste mensagem embed', value: "Teste de texto mensagem embed com inline false", inline: false }
            )
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    messages.forEach(message => {
        message.react('✅');
        message.react('🎃');
        message.react('💸');
        message.react('⚠️');
        message.react('🛡️');
    });
}

module.exports = { SendEmbedRegister };
