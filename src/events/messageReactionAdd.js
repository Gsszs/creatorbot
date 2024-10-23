const { handleReactionLogic } = require('../handlers/reactionHandler');
const { criacoesChatID } = require('../config/IDs');

async function handleReaction(reaction, client) {
    if (reaction.message.channelId === criacoesChatID) {
        await handleReactionLogic(reaction, client);
    }
}

module.exports = { handleReaction };
