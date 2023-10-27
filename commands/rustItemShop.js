const BishopCommand = require('@classes/BishopCommand');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getParentDirectoryString } = require('@helpers/utils');
const { rustChannelId } = require('../config.json');
const { commands } = require('../config.json');
const axios = require('axios');

module.exports = new BishopCommand({
	enabled: commands[getParentDirectoryString(__filename, __dirname)],
	data: new SlashCommandBuilder().setName('rustitemshop').setDescription('Manually post the current item shop'),
	execute: async function(interaction) {

        axios.get('https://rust.scmm.app/api/store/current')
		.then(response => {
            const shopImage = response.data.itemsThumbnailUrl;
            const shopName = response.data.name ?? '';
            const now = new Date(response.data.start);

            interaction.client.channels.cache.get(rustChannelId).send({
                files: [
                    { attachment: `${shopImage}`, name: `item_shop_${now.toDateString()}.png` },
                ],
                content: `Rust Item Store for ${now.toDateString()} \n **${shopName}**`,
            });
        });

		interaction.reply({
			content: `Posted current item shop in Rust channel.`,
			ephemeral: true,
		});
	},
});
