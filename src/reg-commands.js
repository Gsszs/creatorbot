// require("dotenv").config();
// const { REST } = require('@discordjs/rest');
// const { Routes } = require('discord-api-types/v10');

// const commands = [
//     {
//         name: 'status',
//         description: 'Status bot'
//     }
// ];

// const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// (async () => {
//     try {
//         console.log("Tentando adicionar comandos de barra...");

//         await rest.put(
//             Routes.applicationGuildCommands(
//                 process.env.CLIENT_ID,
//                 process.env.GUILD_ID
//             ),
//             { body: commands }  
//         );

//         console.log("Comandos de barra foram adicionados.");
//     } catch (e) {
//         console.error(`Ocorreu um erro: ${e.message}`);
//     }
// })();
