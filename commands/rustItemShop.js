const BishopCommand = require('@classes/BishopCommand');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getParentDirectoryString } = require('@helpers/utils');
const { rustChannelId } = require('../config.json');
const { commands } = require('../config.json');
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = new BishopCommand({
	enabled: commands[getParentDirectoryString(__filename, __dirname)],
	data: new SlashCommandBuilder().setName('rustitemshop').setDescription('Manually post the current item shop'),
	execute: async function(interaction) {

        axios.get('https://rust.scmm.app/api/store/current')
		.then(response => {
            const shopImage = response.data.itemsThumbnailUrl;
            const shopName = response.data.name ?? '';
            const now = new Date(response.data.start);

            if(!shopImage) {
				const itemListEmbed = new EmbedBuilder()
				.setColor(interaction.client.bishop.color)
				.setTitle(`${interaction.client.bishop.name} `)
                .setThumbnail(`${response.data.items[0].iconUrl}`)
				.setDescription(`Rust Item Store for ${now.toDateString()} \n **${shopName}**`)
				.setTimestamp()
				.setFooter({
					text: `Pulled using the ${interaction.client.bishop.name} Bot`
				});

				response.data.items.forEach(item => {
					itemListEmbed.addFields(
						{
							name: `${item.name}`,
							value: `$${item.storePriceUsd / 100}`
						}
					)
				});
				
				return interaction.client.channels.cache.get(rustChannelId).send({
					content: `No item shop image found. Showing list instead.`,
					embeds: [itemListEmbed]
				});
			}

            interaction.client.channels.cache.get(rustChannelId).send({
                files: [
                    { attachment: `${shopImage}`, name: `item_shop_${now.toDateString()}.png` },
                ],
                content: `Rust Item Store for ${now.toDateString()} \n **${shopName}**`,
            });
        });

		await interaction.reply({
			content: `Posted current item shop in Rust channel.`,
			ephemeral: true,
		});
	},
});
