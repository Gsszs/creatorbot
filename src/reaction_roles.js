// require("dotenv").config();
// const { Client, EmbedBuilder } = require("discord.js");
// const { reactionRoleChat } = require("./IDs");

// const client = new Client({
//     intents: [
//         "Guilds", 
//         "GuildMessages", 
//         "MessageContent"
//     ]
// });

// async function SendEmbedRegister() {
//     try {
//         const channel = await client.channels.fetch(reactionRoleChat);
        
//         if (!channel) {
//             console.error("Canal não encontrado!");
//             return;
//         }

//         const messages = await channel.messages.fetch();

//         let embedMessage = null;
//         messages.forEach(message => {
//             if (message.embeds.length > 0 && message.embeds[0].title === '**Teste embed**') {
//                 embedMessage = message;
//             }
//         });

//         if (!embedMessage) {
//             const embed = new EmbedBuilder()
//                 .setColor('#000000')
//                 .setTitle('**Teste embed**')
//                 .addFields(
//                     { name: 'Teste mensagem embed', value: "Teste de texto mensagem embed com inline false", inline: false }
//                 )
//                 .setTimestamp();

//             embedMessage = await channel.send({ embeds: [embed] });
//             console.log("Embed enviado.");
//         } else {
//             console.log("Embed já existe, verificando reações...");
//         }

//         const reactions = ['✅', '🎃', '💸', '⚠️', '🛡️'];
//         for (const reaction of reactions) {
//             if (!embedMessage.reactions.cache.has(reaction)) {
//                 await embedMessage.react(reaction);
//             }
//         }

//     } catch (error) {
//         console.error("Erro ao processar o canal:", error);
//     }
// }

// module.exports = { SendEmbedRegister };