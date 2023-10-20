const { isModuleEnabled } = require('./config');
const package = require('./package');
const BishopModule = require('@classes/BishopModule');

module.exports = (client) => {
	return new BishopModule({
		name: 'Bishop Rust Item Shop',
		description: package.description,
		version: package.version,
		enabled: isModuleEnabled,
		author: package.author,
		directory: __dirname,
		init: function() {
		},
	});
};

