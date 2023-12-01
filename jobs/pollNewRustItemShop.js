const CronJob = require('cron').CronJob;
const { getParentDirectoryString } = require('@helpers/utils');
const { rustChannelId } = require('../config.json');
const { jobs } = require('../config.json');
const axios = require('axios');
const fs = require('fs');
const BishopJob = require('@classes/BishopJob');
const { EmbedBuilder } = require('discord.js');

let pullItemDataInterval;

module.exports = new BishopJob({
	enabled: jobs[getParentDirectoryString(__filename, __dirname, 'jobs')],
	init: async function(client) {
		new CronJob(
			'0 14 * * 4',
			async function() {
				pullItemDataInterval = setInterval(function() {
					getScmmShop(client);
				}, 900000);
				getScmmShop(client);
			},
			null,
			true,
			'America/Indianapolis');
	},
});

function getScmmShop(client) {
	client.bishop.logger.info('Rust Item Store', 'Pulling item store data.');
	axios.get('https://rust.scmm.app/api/store/current')
		.then(response => {
			const newShopId = response.data.id;
			const newShopImage = response.data.itemsThumbnailUrl;
			const shopName = response.data.name ?? '';
			const now = new Date();

			let oldShopExisted = true;

			/* Shop URL can be nullable */
			if(!newShopImage) {
				clearInterval(pullItemDataInterval);
		
				const itemListEmbed = new EmbedBuilder()
				.setColor(client.bishop.color)
				.setTitle(`${client.bishop.name} `)
                .setThumbnail(`${response.data.items[0].iconUrl}`)
				.setDescription(`Rust Item Store for ${now.toDateString()} \n **${shopName}**`)
				.setTimestamp()
				.setFooter({
					text: `Pulled using the ${client.bishop.name} Bot`
				});

				response.data.items.forEach(item => {
					itemListEmbed.addFields(
						{
							name: `${item.name}`,
							value: `$${item.storePriceUsd / 100}`
						}
					)
				});
				
				return client.channels.cache.get(rustChannelId).send({
					content: `No item shop image found. Showing list instead.`,
					embeds: [itemListEmbed]
				});
			}


			/* Check if old shop file exists */
			if (!fs.existsSync(__dirname + '/../old_shop.txt')) {
				fs.writeFileSync(__dirname + '/../old_shop.txt', `${newShopId}`, (err) => {
					if (err) {
						throw Error('Failed to create old shop file.');
					}
					else {
						client.bishop.logger.info('RustItemStore', 'Successfully created old shop file.');
						oldShopExisted = false;
					}
				});
			}

			if (oldShopExisted) {
				const oldShopId = fs.readFileSync(__dirname + '/../old_shop.txt', 'utf8');

				if (oldShopId != newShopId) {
					clearInterval(pullItemDataInterval);
					client.channels.cache.get(rustChannelId).send({
						files: [
							{ attachment: `${newShopImage}`, name: `item_shop_${now.toDateString()}.png` },
						],
						content: `Rust Item Store for ${now.toDateString()} \n **${shopName}**`,
					});
					fs.writeFileSync(__dirname + '/../old_shop.txt', `${newShopId}`, (err) => {
						if (err) {
							throw Error('Failed to update old shop file.');
						}
						else {
							client.bishop.logger.info('Rust Item Store', 'Successfully updated old shop file.');
						}
					});
				}
			}
			else {
				client.channels.cache.get(rustChannelId).send({
					files: [
						{ attachment: `${newShopImage}`, name: `item_shop_${now.toDateString()}.png` },
					],
					content: `Rust Item Store for ${now.toDateString()} \n **${shopName}**`,
				});
			}
		})
		.catch(error => {
			client.bishop.logger.error(`Rust Item Shop', 'Failed to fetch item shop API.\n${error}`);
		});
}
