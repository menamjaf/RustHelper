/*
	Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.

	https://github.com/alexemanuelol/rustplusplus
*/

const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const InstanceUtils = require('../util/instanceUtils.js');
const Constants = require('../util/constants.js');

module.exports = {
	name: 'blueprints',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('blueprints')
			.setDescription(client.intlGet(guildId, 'commandsBlueprintsDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('unlocked')
				.setDescription(client.intlGet(guildId, 'commandsBlueprintsUnlockedDesc'))
				.addStringOption(option => option
					.setName('category')
					.setDescription(client.intlGet(guildId, 'commandsBlueprintsCategoryDesc'))
					.setRequired(false)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('missing')
				.setDescription(client.intlGet(guildId, 'commandsBlueprintsMissingDesc'))
				.addStringOption(option => option
					.setName('category')
					.setDescription(client.intlGet(guildId, 'commandsBlueprintsCategoryDesc'))
					.setRequired(false)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('add')
				.setDescription(client.intlGet(guildId, 'commandsBlueprintsAddDesc'))
				.addStringOption(option => option
					.setName('item')
					.setDescription(client.intlGet(guildId, 'commandsBlueprintsItemDesc'))
					.setRequired(true)
					.setAutocomplete(true))
				.addStringOption(option => option
					.setName('category')
					.setDescription(client.intlGet(guildId, 'commandsBlueprintsCategoryDesc'))
					.setRequired(false)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('remove')
				.setDescription(client.intlGet(guildId, 'commandsBlueprintsRemoveDesc'))
				.addStringOption(option => option
					.setName('item')
					.setDescription(client.intlGet(guildId, 'commandsBlueprintsItemDesc'))
					.setRequired(true)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('member')
				.setDescription(client.intlGet(guildId, 'commandsBlueprintsMemberDesc'))
				.addStringOption(option => option
					.setName('steamid')
					.setDescription(client.intlGet(guildId, 'commandsBlueprintsMemberSteamIdDesc'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('item')
					.setDescription(client.intlGet(guildId, 'commandsBlueprintsItemDesc'))
					.setRequired(false)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('who')
				.setDescription(client.intlGet(guildId, 'commandsBlueprintsWhoDesc'))
				.addStringOption(option => option
					.setName('item')
					.setDescription(client.intlGet(guildId, 'commandsBlueprintsItemDesc'))
					.setRequired(true)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('progress')
				.setDescription(client.intlGet(guildId, 'commandsBlueprintsProgressDesc')));
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;
		const instance = client.getInstance(guildId);

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		// Initialize clan data if not exists
		if (!instance.clan) {
			instance.clan = {
				name: '',
				tag: '',
				members: {},
				activity: {},
				resources: {},
				blueprints: [],
				settings: {
					autoTrackTeamMembers: true,
					trackOnlineActivity: true
				}
			};
			client.setInstance(guildId, instance);
		}

		const clan = instance.clan;

		switch (interaction.options.getSubcommand()) {
			case 'unlocked': {
				await blueprintsUnlockedHandler(client, interaction, clan);
			} break;

			case 'missing': {
				await blueprintsMissingHandler(client, interaction, clan);
			} break;

			case 'add': {
				await blueprintsAddHandler(client, interaction, clan);
			} break;

			case 'remove': {
				await blueprintsRemoveHandler(client, interaction, clan);
			} break;

			case 'member': {
				await blueprintsMemberHandler(client, interaction, clan);
			} break;

			case 'who': {
				await blueprintsWhoHandler(client, interaction, clan);
			} break;

			case 'progress': {
				await blueprintsProgressHandler(client, interaction, clan);
			} break;

			default: {
			} break;
		}

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${interaction.options.getSubcommand()}`
		}));
	},

	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		const name = focusedOption.name;

		if (name === 'category') {
			const choices = Object.keys(BLUEPRINT_CATEGORIES);
			const filtered = choices.filter(choice =>
				choice.toLowerCase().includes(focusedOption.value.toLowerCase())
			).slice(0, 25);
			await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
		} else if (name === 'item') {
			const choices = BLUEPRINT_ITEMS;
			const filtered = choices.filter(choice =>
				choice.toLowerCase().includes(focusedOption.value.toLowerCase())
			).slice(0, 25);
			await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
		}
	}
};

const BLUEPRINT_CATEGORIES = {
	'Construction': 'construction',
	'Weapons': 'weapons',
	'Tools': 'tools',
	'Medical': 'medical',
	'Food': 'food',
	'Attire': 'attire',
	'Components': 'components',
	'Traps': 'traps',
	'Electronics': 'electronics',
	'Vehicles': 'vehicles',
	'Fun': 'fun',
	'Other': 'other'
};

const BLUEPRINT_ITEMS = [
	// Construction
	'Wood Foundation', 'Wood Floor Frame', 'Wood Wall', 'Wood Wall Frame', 'Wood Doorway', 'Wood Window', 'Wood Stairs', 'Wood Ladder Hatch', 'Wood Roof', 'Wood Pillar', 'Wood Gate', 'Wood Double Door', 'Wood Shutter',
	'Stone Foundation', 'Stone Floor Frame', 'Stone Wall', 'Stone Wall Frame', 'Stone Doorway', 'Stone Window', 'Stone Stairs', 'Stone Ladder Hatch', 'Stone Roof', 'Stone Pillar', 'Stone Gate',
	'Metal Foundation', 'Metal Floor Frame', 'Metal Wall', 'Metal Wall Frame', 'Metal Doorway', 'Metal Window', 'Metal Stairs', 'Metal Ladder Hatch', 'Metal Roof', 'Metal Pillar',
	'Armored Foundation', 'Armored Floor Frame', 'Armored Wall', 'Armored Wall Frame', 'Armored Doorway', 'Armored Window', 'Armored Stairs', 'Armored Ladder Hatch', 'Armored Roof', 'Armored Pillar',
	'Wood Door', 'Sheet Metal Door', 'Armored Door', 'Garage Door', 'High External Wooden Gate', 'High External Stone Wall', 'High External Wooden Wall',
	'Barricade', 'Sandbags', 'Barbed Wire', 'Snowman',

	// Weapons
	'Revolver', 'Semi-Automatic Pistol', 'Python Revolver', 'M92 Pistol', 'Thompson', 'Custom SMG', 'MP5A4', 'LR-300 Assault Rifle', 'Assault Rifle', 'Bolt Action Rifle', 'Semi-Automatic Rifle', 'M249', 'L96 Rifle', 'M39 Rifle',
	'Crossbow', 'Compound Bow', 'Hunting Bow', 'Nailgun', 'Eoka Pistol', 'Waterpipe Shotgun', 'Double Barrel Shotgun', 'Pump Shotgun', 'Spas-12 Shotgun',
	'Rocket Launcher', 'Flare Gun', 'Spear Gun',
	'Satchel Charge', 'Timed Explosive Charge', 'Explosive 5.56 Rifle Ammo', 'Incendiary 5.56 Rifle Ammo', 'HV 5.56 Rifle Ammo', '5.56 Rifle Ammo',
	'Explosive 5.56 Pistol Ammo', 'Incendiary 5.56 Pistol Ammo', 'HV 5.56 Pistol Ammo', '5.56 Pistol Ammo',
	'Explosive 12 Gauge Ammo', 'Incendiary 12 Gauge Ammo', 'Slug 12 Gauge Ammo', 'Handmade Shell',
	'Rocket', 'HV Rocket', 'Incendiary Rocket',
	'Beancan Grenade', 'F1 Grenade', 'Flashbang', 'Smoke Grenade',
	'Bone Knife', 'Combat Knife', 'Machete', 'Longsword', 'Salvaged Cleaver', 'Salvaged Sword',
	'Rock', 'Stone Hatchet', 'Stone Pickaxe', 'Salvaged Axe', 'Salvaged Pickaxe', 'Jackhammer', 'Chainsaw',

	// Tools
	'Hammer', 'Building Plan', 'Tool Cupboard', 'Large Wood Box', 'Wood Storage Box', 'Small Stash', 'Sleeping Bag', 'Bed', 'Camp Fire', 'Furnace', 'Large Furnace', 'Oil Refinery', 'Recycler', 'Repair Bench',
	'Research Table', 'Workbench Level 1', 'Workbench Level 2', 'Workbench Level 3',
	'Water Catcher', 'Water Purifier', 'Water Barrel',
	'Planter Box', 'Large Planter Box', 'Composter',
	'Vending Machine', 'Autoturret', 'Flamethrower Trap', 'Shotgun Trap', 'Landmine', 'Bear Trap',
	'Search Light', 'Ceiling Light', 'Floor Frame', 'Window Bars', 'Floor Triangle Frame', 'Floor Triangle', 'Floor Frame',
	'Elevator', 'Powered Elevator', 'Industrial Conveyor', 'Industrial Storage Adapter',

	// Medical
	'Medical Syringe', 'Large Medkit', 'Bandage', 'Anti-Radiation Pills', 'Tea', 'Blood Bag', 'Health Kit',

	// Food
	'Cooked Meat', 'Burnt Meat', 'Raw Chicken Breast', 'Cooked Chicken', 'Burnt Chicken', 'Granola Bar', 'Can of Beans', 'Can of Tuna', 'Pickles', 'Blueberries', 'Blackberries', 'Potato', 'Cooked Potato', 'Burnt Potato', 'Corn', 'Cooked Corn', 'Pumpkin', 'Cooked Pumpkin', 'Mushroom', 'Cooked Mushroom', 'Human Meat', 'Cooked Human Meat', 'Burnt Human Meat', 'Chocolate Bar', 'Minnows', 'Cooked Minnows', 'Trout', 'Cooked Trout', 'Salmon', 'Cooked Salmon', 'Catfish', 'Cooked Catfish', 'Orange Roughy', 'Cooked Orange Roughy', 'Yellow Perch', 'Cooked Yellow Perch', 'Small Shark', 'Cooked Small Shark', 'Minnows', 'Anchovies', 'Herring', 'Sardines', 'Mackerel', 'Trout', 'Salmon', 'Catfish', 'Yellow Perch', 'Orange Roughy', 'Small Shark',

	// Attire
	'Burlap Shirt', 'Burlap Trousers', 'Burlap Headwrap', 'Burlap Shoes', 'Burlap Gloves',
	'Heavy Plate Helmet', 'Heavy Plate Jacket', 'Heavy Plate Pants', 'Heavy Plate Gloves', 'Heavy Plate Boots',
	'Metal Facemask', 'Metal Chest Plate', 'Metal Leg Plates', 'Metal Gloves', 'Metal Boots',
	'Roadsign Kilt', 'Roadsign Jacket', 'Roadsign Gloves', 'Roadsign Boots',
	'Hazmat Suit', 'Diving Suit', 'Hazmat Gloves', 'Hazmat Boots',
	'Wolf Headdress', 'Deer Skull Mask', 'Boar Mask', 'Wolf Mask', 'Twitch Mask', 'Ghillie Suit',
	'Coffee Can Helmet', 'Riot Helmet', 'Bucket Helmet', 'Mining Helmet', 'Candle Hat', 'Beenie', 'Balaclava', 'Bandana', 'Baseball Cap', 'Boonie Hat', 'Beret',
	'Shirt', 'Longsleeve T-Shirt', 'T-Shirt', 'Tank Top', 'Hoodie', 'Jacket', 'Poncho', 'Kilt', 'Shorts', 'Pants', 'Heavy Pants', 'Hide Pants', 'Hide Vest', 'Hide Helmet', 'Hide Boots', 'Hide Gloves',
	'Attire Snow Jacket', 'Snow Pants', 'Snow Boots', 'Snow Gloves',

	// Components
	'Metal Blade', 'Metal Pipe', 'Metal Spring', 'Gears', 'Sheet Metal', 'Tech Trash', 'Rifle Body', 'Semi-Automatic Body', 'SMG Body', 'Road Signs', 'Targeting Computer', 'CCTV Camera', 'Electric Fuse', 'Empty Propane Tank',

	// Traps
	'Landmine', 'Bear Trap', 'Shotgun Trap', 'Flamethrower Trap', 'Auto Turret',

	// Electronics
	'CCTV Camera', 'Computer Station', 'Targeting Computer', 'Large Rechargeable Battery', 'Medium Rechargeable Battery', 'Small Rechargeable Battery',
	'Solar Panel', 'Wind Turbine', 'Small Generator', 'Root Combiner', 'Power Counter', 'Passthrough Counter', 'Electrical Branch', 'Splitter', 'Blocker', 'Timer', 'Counter', 'HBHF Sensor', 'Laser Detector', 'Pressure Pad', 'RF Receiver', 'RF Broadcaster', 'RF Pager', 'Smart Switch', 'Smart Alarm', 'Storage Monitor', 'Memory Cell', 'XOR Switch', 'AND Switch', 'OR Switch', 'Switch', 'Igniter', 'Timer', 'Siren Light', 'Disco Floor', 'Ceiling Light', 'Heater', 'Autoturret', 'Boom Box', 'Broadcaster', 'Door Controller', 'Elevator', 'HBHF Sensor', 'Large Wood Box', 'Recycler', 'SAM Site', 'Sprinkler', 'Christmas Lights',

	// Vehicles
	'Minicopter', 'Scrap Transport Helicopter', 'CH-47 Chinook', 'Hot Air Balloon', 'Rowboat', 'RHIB', 'Sedan', 'Modular Car', 'Chassis', 'Engine', 'Cockpit', 'Flatbed', 'Fuel Tank', 'Storage', 'Passenger', 'Weapon Mount',

	// Fun
	'Guitar', 'Pan Flute', 'Wheelbarrow', 'Jackhammer', 'Chainsaw', 'Candy Cane Club', 'Candy Cane', 'Snowball', 'Firework Rocket', 'Firework Roman Candle', 'Firework Star', 'Firework Fountain', 'Flashlight', 'Lantern', 'Candle', 'Can Lantern', 'Tuna Can Lamp', 'Waterpipe Shotgun', 'Eoka Pistol',
];

async function blueprintsUnlockedHandler(client, interaction, clan) {
	const guildId = interaction.guildId;
	const category = interaction.options.getString('category');

	const unlocked = clan.blueprints || [];
	const filtered = category ? unlocked.filter(b => BLUEPRINT_CATEGORIES[category]?.includes(b)) : unlocked;

	if (filtered.length === 0) {
		const str = client.intlGet(guildId, 'blueprintsNoUnlocked');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	// Group by category
	const byCategory = {};
	for (const bp of filtered) {
		let cat = 'Other';
		for (const [catName, items] of Object.entries(BLUEPRINT_CATEGORIES)) {
			if (items.includes(bp)) {
				cat = catName;
				break;
			}
		}
		if (!byCategory[cat]) byCategory[cat] = [];
		byCategory[cat].push(bp);
	}

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'blueprintsUnlockedTitle')}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `${clan.tag ? `[${clan.tag}] ` : ''}${clan.name || client.intlGet(guildId, 'clanUnnamed')}` }
	});

	let description = '';
	for (const [cat, items] of Object.entries(byCategory)) {
		description += `__**${cat}**__ (${items.length})\n`;
		for (const item of items.slice(0, 15)) {
			description += `• ${item}\n`;
		}
		if (items.length > 15) {
			description += `• ... and ${items.length - 15} more\n`;
		}
		description += '\n';
	}

	embed.setDescription(description);
	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function blueprintsMissingHandler(client, interaction, clan) {
	const guildId = interaction.guildId;
	const category = interaction.options.getString('category');

	const unlocked = new Set(clan.blueprints || []);
	const allItems = BLUEPRINT_ITEMS;

	let filtered = allItems.filter(item => !unlocked.has(item));
	if (category) {
		const catItems = BLUEPRINT_CATEGORIES[category] || [];
		filtered = filtered.filter(item => catItems.includes(item));
	}

	if (filtered.length === 0) {
		const str = client.intlGet(guildId, 'blueprintsAllUnlocked');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
		return;
	}

	// Group by category
	const byCategory = {};
	for (const bp of filtered) {
		let cat = 'Other';
		for (const [catName, items] of Object.entries(BLUEPRINT_CATEGORIES)) {
			if (items.includes(bp)) {
				cat = catName;
				break;
			}
		}
		if (!byCategory[cat]) byCategory[cat] = [];
		byCategory[cat].push(bp);
	}

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'blueprintsMissingTitle')}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `${clan.tag ? `[${clan.tag}] ` : ''}${clan.name || client.intlGet(guildId, 'clanUnnamed')}` }
	});

	let description = `Total missing: ${filtered.length}\n\n`;
	for (const [cat, items] of Object.entries(byCategory)) {
		description += `__**${cat}**__ (${items.length})\n`;
		for (const item of items.slice(0, 15)) {
			description += `• ${item}\n`;
		}
		if (items.length > 15) {
			description += `• ... and ${items.length - 15} more\n`;
		}
		description += '\n';
	}

	embed.setDescription(description);
	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function blueprintsAddHandler(client, interaction, clan) {
	const guildId = interaction.guildId;
	const item = interaction.options.getString('item');
	const category = interaction.options.getString('category');

	if (!clan.blueprints) clan.blueprints = [];

	if (clan.blueprints.includes(item)) {
		const str = client.intlGet(guildId, 'blueprintsAlreadyUnlocked', { item: item });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	clan.blueprints.push(item);
	client.setInstance(interaction.guildId, client.getInstance(interaction.guildId));

	const str = client.intlGet(guildId, 'blueprintsAdded', { item: item });
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(null, 'infoCap'), str);
}

async function blueprintsRemoveHandler(client, interaction, clan) {
	const guildId = interaction.guildId;
	const item = interaction.options.getString('item');

	if (!clan.blueprints || !clan.blueprints.includes(item)) {
		const str = client.intlGet(guildId, 'blueprintsNotUnlocked', { item: item });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	clan.blueprints = clan.blueprints.filter(bp => bp !== item);
	client.setInstance(interaction.guildId, client.getInstance(interaction.guildId));

	const str = client.intlGet(guildId, 'blueprintsRemoved', { item: item });
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(null, 'infoCap'), str);
}

async function blueprintsMemberHandler(client, interaction, clan) {
	const guildId = interaction.guildId;
	const steamId = interaction.options.getString('steamid');
	const item = interaction.options.getString('item');

	if (!clan.members[steamId]) {
		const str = client.intlGet(guildId, 'clanMemberNotFound', { steamId: steamId });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	if (!clan.memberBlueprints) clan.memberBlueprints = {};
	if (!clan.memberBlueprints[steamId]) clan.memberBlueprints[steamId] = [];

	const member = clan.members[steamId];
	const blueprints = clan.memberBlueprints[steamId];

	if (item) {
		// Toggle specific blueprint for member
		if (blueprints.includes(item)) {
			clan.memberBlueprints[steamId] = blueprints.filter(bp => bp !== item);
			const str = client.intlGet(guildId, 'blueprintsMemberRemoved', { item: item, name: member.name });
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
		} else {
			clan.memberBlueprints[steamId].push(item);
			const str = client.intlGet(guildId, 'blueprintsMemberAdded', { item: item, name: member.name });
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
		}
		client.setInstance(interaction.guildId, client.getInstance(interaction.guildId));
		return;
	}

	// Show all blueprints for member
	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'blueprintsMemberTitle')}: ${member.name}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `SteamID: ${steamId}` }
	});

	if (blueprints.length === 0) {
		embed.setDescription(client.intlGet(guildId, 'blueprintsMemberNone'));
	} else {
		// Group by category
		const byCategory = {};
		for (const bp of blueprints) {
			let cat = 'Other';
			for (const [catName, items] of Object.entries(BLUEPRINT_CATEGORIES)) {
				if (items.includes(bp)) {
					cat = catName;
					break;
				}
			}
			if (!byCategory[cat]) byCategory[cat] = [];
			byCategory[cat].push(bp);
		}

		let description = '';
		for (const [cat, items] of Object.entries(byCategory)) {
			description += `__**${cat}**__ (${items.length})\n`;
			for (const bpItem of items) {
				description += `• ${bpItem}\n`;
			}
			description += '\n';
		}
		embed.setDescription(description);
	}

	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function blueprintsWhoHandler(client, interaction, clan) {
	const guildId = interaction.guildId;
	const item = interaction.options.getString('item');

	const members = [];
	if (clan.memberBlueprints) {
		for (const [steamId, blueprints] of Object.entries(clan.memberBlueprints)) {
			if (blueprints.includes(item)) {
				const member = clan.members[steamId];
				if (member) {
					members.push({
						name: member.name,
						steamId: steamId,
						isOnline: member.isOnline || false
					});
				}
			}
		}
	}

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'blueprintsWhoTitle')}: ${item}`,
		color: DiscordEmbeds.COLOR_DEFAULT
	});

	if (members.length === 0) {
		embed.setDescription(client.intlGet(guildId, 'blueprintsWhoNone'));
	} else {
		let description = '';
		for (const member of members) {
			const statusIcon = member.isOnline ? ':green_circle:' : ':red_circle:';
			description += `${statusIcon} **${member.name}** (${member.steamId})\n`;
		}
		embed.setDescription(description);
	}

	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function blueprintsProgressHandler(client, interaction, clan) {
	const guildId = interaction.guildId;

	const unlocked = new Set(clan.blueprints || []);
	const total = BLUEPRINT_ITEMS.length;
	const unlockedCount = clan.blueprints?.length || 0;
	const missingCount = total - unlockedCount;
	const percent = Math.round((unlockedCount / total) * 100);

	// Progress by category
	const categoryStats = {};
	for (const [cat, items] of Object.entries(BLUEPRINT_CATEGORIES)) {
		const unlockedInCat = items.filter(item => unlocked.has(item)).length;
		categoryStats[cat] = {
			total: items.length,
			unlocked: unlockedInCat,
			percent: Math.round((unlockedInCat / items.length) * 100)
		};
	}

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'blueprintsProgressTitle')}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `${clan.tag ? `[${clan.tag}] ` : ''}${clan.name || client.intlGet(guildId, 'clanUnnamed')}` }
	});

	let description = `__**Overall Progress**__\n`;
	description += `${unlockedCount} / ${total} (${percent}%)\n`;
	description += `${createProgressBar(percent)}\n\n`;

	description += `__**By Category**__\n`;
	for (const [cat, stats] of Object.entries(categoryStats)) {
		if (stats.total > 0) {
			description += `**${cat}**: ${stats.unlocked} / ${stats.total} (${stats.percent}%) ${createProgressBar(stats.percent)}\n`;
		}
	}

	embed.setDescription(description);
	await client.interactionEditReply(interaction, { embeds: [embed] });
}

function createProgressBar(percent) {
	const filled = Math.floor(percent / 10);
	const empty = 10 - filled;
	return '█'.repeat(filled) + '░'.repeat(empty);
}