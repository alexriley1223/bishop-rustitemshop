const CronJob = require('cron').CronJob;
const { getParentDirectoryString } = require('@helpers/utils');
const log = require('@helpers/logger');
const { rustChannelId } = require('../config.json');
const { jobs } = require('../config.json');
const axios = require('axios');
const fs = require('fs');

let pullItemDataInterval;

module.exports = function(client) {

    const job = {};

	job.enabled = jobs[getParentDirectoryString(__filename, __dirname, 'jobs')];

	job.executeJob = function() {
		new CronJob(
            '0 14 * * 4',
            async function() {
                pullItemDataInterval = setInterval(function() {
                    getScmmShop(client);
                }, 900000); // Every 15 minutes keep checking
                getScmmShop(client);
            },
            null,
            true,
            'America/Indianapolis');
	}

    return job;
};

function getScmmShop(client) {
    log.info('Rust Item Store', '✅ Pulling item store data.')
    axios.get('https://rust.scmm.app/api/store/current')
    .then(response => {
        const newShopId = response.data.id;
        const newShopImage = response.data.itemsThumbnailUrl;
        let oldShopExisted = true;

        /* Check if old shop file exists */
        if (!fs.existsSync(__dirname + '/../old_shop.txt')) {
            fs.writeFileSync(__dirname + '/../old_shop.txt', `${newShopId}`, (err) => {
                if(err) {
                    throw Error('❌ Failed to create old shop file.');
                } else {
                    log.info('Rust Item Store', '✅ Successfully created old shop file.')
                    oldShopExisted = false;
                }
            });
        }

        const now = new Date();
        if(oldShopExisted) {
            const oldShopId = fs.readFileSync(__dirname + '/../old_shop.txt', 'utf8');

            if(oldShopId != newShopId) {
                clearInterval(pullItemDataInterval);
                client.channels.cache.get(rustChannelId).send({
                    files: [
                        {attachment: `${newShopImage}`, name: `item_shop_${now.toDateString()}.png`},
                    ],
                    content: `Rust Item Store for ${now.toDateString()}`
                });
                fs.writeFileSync(__dirname + '/../old_shop.txt', `${newShopId}`, (err) => {
                    if(err) {
                        throw Error('❌ Failed to update old shop file.');
                    } else {
                        log.info('Rust Item Store', '✅ Successfully updated old shop file.')
                    }
                });
            }
        } else {
            client.channels.cache.get(rustChannelId).send({
                files: [
                    {attachment: `${newShopImage}`, name: `item_shop_${now.toDateString()}.png`},
                ],
                content: `Rust Item Store for ${now.toDateString()}`
            });
        }
    })
    .catch(error => {
        log.error(`Rust Item Shop', '❌ Failed to fetch item shop API.\n${error}`);
    });
}
