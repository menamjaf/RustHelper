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
	name: 'resources',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('resources')
			.setDescription(client.intlGet(guildId, 'commandsResourcesDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('deposit')
				.setDescription(client.intlGet(guildId, 'commandsResourcesDepositDesc'))
				.addStringOption(option => option
					.setName('item')
					.setDescription(client.intlGet(guildId, 'commandsResourcesItemDesc'))
					.setRequired(true)
					.setAutocomplete(true))
				.addIntegerOption(option => option
					.setName('amount')
					.setDescription(client.intlGet(guildId, 'commandsResourcesAmountDesc'))
					.setRequired(true)
					.setMinValue(1))
				.addStringOption(option => option
					.setName('note')
					.setDescription(client.intlGet(guildId, 'commandsResourcesNoteDesc'))
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('withdraw')
				.setDescription(client.intlGet(guildId, 'commandsResourcesWithdrawDesc'))
				.addStringOption(option => option
					.setName('item')
					.setDescription(client.intlGet(guildId, 'commandsResourcesItemDesc'))
					.setRequired(true)
					.setAutocomplete(true))
				.addIntegerOption(option => option
					.setName('amount')
					.setDescription(client.intlGet(guildId, 'commandsResourcesAmountDesc'))
					.setRequired(true)
					.setMinValue(1))
				.addStringOption(option => option
					.setName('note')
					.setDescription(client.intlGet(guildId, 'commandsResourcesNoteDesc'))
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('farm')
				.setDescription(client.intlGet(guildId, 'commandsResourcesFarmDesc'))
				.addStringOption(option => option
					.setName('item')
					.setDescription(client.intlGet(guildId, 'commandsResourcesItemDesc'))
					.setRequired(true)
					.setAutocomplete(true))
				.addIntegerOption(option => option
					.setName('amount')
					.setDescription(client.intlGet(guildId, 'commandsResourcesAmountDesc'))
					.setRequired(true)
					.setMinValue(1))
				.addStringOption(option => option
					.setName('note')
					.setDescription(client.intlGet(guildId, 'commandsResourcesNoteDesc'))
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('leaderboard')
				.setDescription(client.intlGet(guildId, 'commandsResourcesLeaderboardDesc'))
				.addStringOption(option => option
					.setName('type')
					.setDescription(client.intlGet(guildId, 'commandsResourcesLeaderboardTypeDesc'))
					.setRequired(false)
					.addChoices(
						{ name: client.intlGet(guildId, 'deposited'), value: 'deposited' },
						{ name: client.intlGet(guildId, 'farmed'), value: 'farmed' },
						{ name: client.intlGet(guildId, 'net'), value: 'net' })))
			.addSubcommand(subcommand => subcommand
				.setName('goal')
				.setDescription(client.intlGet(guildId, 'commandsResourcesGoalDesc'))
				.addStringOption(option => option
					.setName('item')
					.setDescription(client.intlGet(guildId, 'commandsResourcesItemDesc'))
					.setRequired(true)
					.setAutocomplete(true))
				.addIntegerOption(option => option
					.setName('amount')
					.setDescription(client.intlGet(guildId, 'commandsResourcesGoalAmountDesc'))
					.setRequired(true)
					.setMinValue(1))
				.addStringOption(option => option
					.setName('action')
					.setDescription(client.intlGet(guildId, 'commandsResourcesGoalActionDesc'))
					.setRequired(false)
					.addChoices(
						{ name: client.intlGet(guildId, 'set'), value: 'set' },
						{ name: client.intlGet(guildId, 'remove'), value: 'remove' })))
			.addSubcommand(subcommand => subcommand
				.setName('history')
				.setDescription(client.intlGet(guildId, 'commandsResourcesHistoryDesc'))
				.addStringOption(option => option
					.setName('steamid')
					.setDescription(client.intlGet(guildId, 'commandsResourcesHistorySteamIdDesc'))
					.setRequired(false))
				.addIntegerOption(option => option
					.setName('limit')
					.setDescription(client.intlGet(guildId, 'commandsResourcesHistoryLimitDesc'))
					.setRequired(false)
					.setMinValue(1)
					.setMaxValue(50)))
			.addSubcommand(subcommand => subcommand
				.setName('view')
				.setDescription(client.intlGet(guildId, 'commandsResourcesViewDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('goals')
				.setDescription(client.intlGet(guildId, 'commandsResourcesGoalsDesc')));
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

		// Find the user's SteamID
		let userSteamId = null;
		for (const [steamId, member] of Object.entries(clan.members)) {
			if (member.discordId === interaction.user.id) {
				userSteamId = steamId;
				break;
			}
		}

		switch (interaction.options.getSubcommand()) {
			case 'deposit': {
				await resourcesDepositHandler(client, interaction, clan, userSteamId);
			} break;

			case 'withdraw': {
				await resourcesWithdrawHandler(client, interaction, clan, userSteamId);
			} break;

			case 'farm': {
				await resourcesFarmHandler(client, interaction, clan, userSteamId);
			} break;

			case 'leaderboard': {
				await resourcesLeaderboardHandler(client, interaction, clan);
			} break;

			case 'goal': {
				await resourcesGoalHandler(client, interaction, clan);
			} break;

			case 'history': {
				await resourcesHistoryHandler(client, interaction, clan);
			} break;

			case 'view': {
				await resourcesViewHandler(client, interaction, clan);
			} break;

			case 'goals': {
				await resourcesGoalsHandler(client, interaction, clan);
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
		const choices = Object.keys(RUST_ITEMS);
		const filtered = choices.filter(choice =>
			choice.toLowerCase().includes(focusedOption.value.toLowerCase())
		).slice(0, 25);
		await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
	}
};

const RUST_ITEMS = {
	'Wood': 'wood',
	'Stone': 'stone',
	'Metal Fragments': 'metal_fragments',
	'High Quality Metal': 'hqm',
	'Sulfur': 'sulfur',
	'Charcoal': 'charcoal',
	'Scrap': 'scrap',
	'Low Grade Fuel': 'low_grade_fuel',
	'Explosives': 'explosives',
	'Gunpowder': 'gunpowder',
	'Cloth': 'cloth',
	'Leather': 'leather',
	'Rope': 'rope',
	'Tech Trash': 'tech_trash',
	'Gears': 'gears',
	'Springs': 'springs',
	'Pipes': 'pipes',
	'Sheet Metal': 'sheet_metal',
	'Rifle Body': 'rifle_body',
	'Semi-Automatic Body': 'semi_body',
	'SMG Body': 'smg_body',
	'Metal Blade': 'metal_blade',
	'Metal Pipe': 'metal_pipe',
	'Road Sign': 'road_sign',
	'Targeting Computer': 'targeting_computer',
	'CCTV Camera': 'cctv_camera',
	'Electric Fuse': 'electric_fuse',
	'Empty Propane Tank': 'empty_propane_tank',
	'Fuel': 'fuel'
};

async function resourcesDepositHandler(client, interaction, clan, userSteamId) {
	const guildId = interaction.guildId;
	const item = interaction.options.getString('item');
	const amount = interaction.options.getInteger('amount');
	const note = interaction.options.getString('note') || '';

	if (!userSteamId) {
		const str = client.intlGet(guildId, 'resourcesNotRegistered');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	if (!clan.members[userSteamId]) {
		const str = client.intlGet(guildId, 'clanMemberNotFound', { steamId: userSteamId });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	// Initialize resources for user if not exists
	if (!clan.resources[userSteamId]) {
		clan.resources[userSteamId] = { deposited: {}, withdrawn: {}, farmed: {}, history: [] };
	}

	// Add to deposited
	clan.resources[userSteamId].deposited[item] = (clan.resources[userSteamId].deposited[item] || 0) + amount;

	// Add to history
	clan.resources[userSteamId].history.unshift({
		type: 'deposit',
		item: item,
		amount: amount,
		note: note,
		timestamp: new Date().toISOString(),
		user: clan.members[userSteamId].name
	});

	// Keep history limited
	if (clan.resources[userSteamId].history.length > 100) {
		clan.resources[userSteamId].history = clan.resources[userSteamId].history.slice(0, 100);
	}

	client.setInstance(interaction.guildId, client.getInstance(interaction.guildId));

	const str = client.intlGet(guildId, 'resourcesDeposited', { amount: amount, item: item });
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(null, 'infoCap'), str);
}

async function resourcesWithdrawHandler(client, interaction, clan, userSteamId) {
	const guildId = interaction.guildId;
	const item = interaction.options.getString('item');
	const amount = interaction.options.getInteger('amount');
	const note = interaction.options.getString('note') || '';

	if (!userSteamId) {
		const str = client.intlGet(guildId, 'resourcesNotRegistered');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	if (!clan.members[userSteamId]) {
		const str = client.intlGet(guildId, 'clanMemberNotFound', { steamId: userSteamId });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	if (!clan.resources[userSteamId]) {
		clan.resources[userSteamId] = { deposited: {}, withdrawn: {}, farmed: {}, history: [] };
	}

	// Check if enough deposited
	const deposited = clan.resources[userSteamId].deposited[item] || 0;
	if (deposited < amount) {
		const str = client.intlGet(guildId, 'resourcesInsufficient', { item: item, available: deposited });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	// Subtract from deposited, add to withdrawn
	clan.resources[userSteamId].deposited[item] = deposited - amount;
	clan.resources[userSteamId].withdrawn[item] = (clan.resources[userSteamId].withdrawn[item] || 0) + amount;

	// Add to history
	clan.resources[userSteamId].history.unshift({
		type: 'withdraw',
		item: item,
		amount: amount,
		note: note,
		timestamp: new Date().toISOString(),
		user: clan.members[userSteamId].name
	});

	if (clan.resources[userSteamId].history.length > 100) {
		clan.resources[userSteamId].history = clan.resources[userSteamId].history.slice(0, 100);
	}

	client.setInstance(interaction.guildId, client.getInstance(interaction.guildId));

	const str = client.intlGet(guildId, 'resourcesWithdrawn', { amount: amount, item: item });
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(null, 'infoCap'), str);
}

async function resourcesFarmHandler(client, interaction, clan, userSteamId) {
	const guildId = interaction.guildId;
	const item = interaction.options.getString('item');
	const amount = interaction.options.getInteger('amount');
	const note = interaction.options.getString('note') || '';

	if (!userSteamId) {
		const str = client.intlGet(guildId, 'resourcesNotRegistered');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	if (!clan.members[userSteamId]) {
		const str = client.intlGet(guildId, 'clanMemberNotFound', { steamId: userSteamId });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	if (!clan.resources[userSteamId]) {
		clan.resources[userSteamId] = { deposited: {}, withdrawn: {}, farmed: {}, history: [] };
	}

	// Add to farmed
	clan.resources[userSteamId].farmed[item] = (clan.resources[userSteamId].farmed[item] || 0) + amount;

	// Add to history
	clan.resources[userSteamId].history.unshift({
		type: 'farm',
		item: item,
		amount: amount,
		note: note,
		timestamp: new Date().toISOString(),
		user: clan.members[userSteamId].name
	});

	if (clan.resources[userSteamId].history.length > 100) {
		clan.resources[userSteamId].history = clan.resources[userSteamId].history.slice(0, 100);
	}

	client.setInstance(interaction.guildId, client.getInstance(interaction.guildId));

	const str = client.intlGet(guildId, 'resourcesFarmed', { amount: amount, item: item });
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(null, 'infoCap'), str);
}

async function resourcesLeaderboardHandler(client, interaction, clan) {
	const guildId = interaction.guildId;
	const type = interaction.options.getString('type') || 'deposited';

	if (Object.keys(clan.members).length === 0) {
		const str = client.intlGet(guildId, 'clanNoMembers');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	const members = [];
	for (const [steamId, member] of Object.entries(clan.members)) {
		const resources = clan.resources[steamId] || { deposited: {}, withdrawn: {}, farmed: {} };
		let total = 0;

		if (type === 'deposited') {
			for (const amount of Object.values(resources.deposited)) total += amount;
		} else if (type === 'farmed') {
			for (const amount of Object.values(resources.farmed)) total += amount;
		} else if (type === 'net') {
			for (const [item, amount] of Object.entries(resources.deposited)) {
				const withdrawn = resources.withdrawn[item] || 0;
				total += amount - withdrawn;
			}
		}

		members.push({
			name: member.name,
			total: total,
			isOnline: member.isOnline || false
		});
	}

	members.sort((a, b) => b.total - a.total);

	const typeName = type === 'deposited' ? client.intlGet(guildId, 'deposited') :
		type === 'farmed' ? client.intlGet(guildId, 'farmed') : client.intlGet(guildId, 'net');

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'resourcesLeaderboardTitle')}: ${typeName}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `${clan.tag ? `[${clan.tag}] ` : ''}${clan.name || client.intlGet(guildId, 'clanUnnamed')}` }
	});

	let description = '';
	for (let i = 0; i < Math.min(members.length, 20); i++) {
		const member = members[i];
		const statusIcon = member.isOnline ? ':green_circle:' : ':red_circle:';
		description += `#${i + 1} ${statusIcon} **${member.name}** - ${member.total.toLocaleString()}\n`;
	}

	if (description === '') {
		description = client.intlGet(guildId, 'resourcesNoData');
	}

	embed.setDescription(description);
	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function resourcesGoalHandler(client, interaction, clan) {
	const guildId = interaction.guildId;
	const item = interaction.options.getString('item');
	const amount = interaction.options.getInteger('amount');
	const action = interaction.options.getString('action') || 'set';

	if (!clan.goals) clan.goals = {};

	if (action === 'remove') {
		delete clan.goals[item];
		const str = client.intlGet(guildId, 'resourcesGoalRemoved', { item: item });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	} else {
		clan.goals[item] = amount;
		const str = client.intlGet(guildId, 'resourcesGoalSet', { item: item, amount: amount });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	}

	client.setInstance(interaction.guildId, client.getInstance(interaction.guildId));
}

async function resourcesHistoryHandler(client, interaction, clan) {
	const guildId = interaction.guildId;
	const steamId = interaction.options.getString('steamid');
	const limit = interaction.options.getInteger('limit') || 20;

	let targetSteamId = steamId;
	if (!targetSteamId) {
		// Find user's own SteamID
		for (const [sid, member] of Object.entries(clan.members)) {
			if (member.discordId === interaction.user.id) {
				targetSteamId = sid;
				break;
			}
		}
	}

	if (!targetSteamId || !clan.resources[targetSteamId]) {
		const str = client.intlGet(guildId, 'resourcesNoHistory');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	const history = clan.resources[targetSteamId].history.slice(0, limit);
	const memberName = clan.members[targetSteamId]?.name || targetSteamId;

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'resourcesHistoryTitle')}: ${memberName}`,
		color: DiscordEmbeds.COLOR_DEFAULT
	});

	let description = '';
	for (const entry of history) {
		const time = DiscordTools.getDiscordFormattedDate(Math.floor(new Date(entry.timestamp).getTime() / 1000));
		const typeIcon = entry.type === 'deposit' ? ':inbox_tray:' : entry.type === 'withdraw' ? ':outbox_tray:' : ':tractor:';
		const typeName = entry.type === 'deposit' ? client.intlGet(guildId, 'deposited') :
			entry.type === 'withdraw' ? client.intlGet(guildId, 'withdrawn') : client.intlGet(guildId, 'farmed');
		const amountStr = entry.type === 'withdraw' ? `-${entry.amount}` : `+${entry.amount}`;
		const noteStr = entry.note ? ` (${entry.note})` : '';

		description += `${typeIcon} **${entry.item}**: ${amountStr} [${typeName}]${noteStr}\n`;
		description += `  ${time}\n\n`;
	}

	if (description === '') {
		description = client.intlGet(guildId, 'resourcesNoHistory');
	}

	embed.setDescription(description);
	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function resourcesViewHandler(client, interaction, clan) {
	const guildId = interaction.guildId;

	if (Object.keys(clan.members).length === 0) {
		const str = client.intlGet(guildId, 'clanNoMembers');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	// Aggregate all resources
	const totalDeposited = {};
	const totalWithdrawn = {};
	const totalFarmed = {};

	for (const [steamId, member] of Object.entries(clan.members)) {
		const resources = clan.resources[steamId] || { deposited: {}, withdrawn: {}, farmed: {} };
		for (const [item, amount] of Object.entries(resources.deposited)) {
			totalDeposited[item] = (totalDeposited[item] || 0) + amount;
		}
		for (const [item, amount] of Object.entries(resources.withdrawn)) {
			totalWithdrawn[item] = (totalWithdrawn[item] || 0) + amount;
		}
		for (const [item, amount] of Object.entries(resources.farmed)) {
			totalFarmed[item] = (totalFarmed[item] || 0) + amount;
		}
	}

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'resourcesViewTitle')}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `${clan.tag ? `[${clan.tag}] ` : ''}${clan.name || client.intlGet(guildId, 'clanUnnamed')}` }
	});

	let description = `__**${client.intlGet(guildId, 'clanTotalResources')}**__\n\n`;

	// Show net resources (deposited - withdrawn)
	const allItems = new Set([...Object.keys(totalDeposited), ...Object.keys(totalWithdrawn), ...Object.keys(totalFarmed)]);
	const sortedItems = Array.from(allItems).sort();

	for (const item of sortedItems) {
		const deposited = totalDeposited[item] || 0;
		const withdrawn = totalWithdrawn[item] || 0;
		const farmed = totalFarmed[item] || 0;
		const net = deposited - withdrawn;

		if (net > 0 || farmed > 0) {
			description += `**${item}**: ${net.toLocaleString()} (${client.intlGet(guildId, 'net')})`;
			if (farmed > 0) description += ` | ${client.intlGet(guildId, 'farmed')}: ${farmed.toLocaleString()}`;
			description += '\n';
		}
	}

	// Show goals progress
	if (clan.goals && Object.keys(clan.goals).length > 0) {
		description += `\n__**${client.intlGet(guildId, 'resourcesGoals')}**__\n`;
		for (const [item, goalAmount] of Object.entries(clan.goals)) {
			const net = (totalDeposited[item] || 0) - (totalWithdrawn[item] || 0);
			const progress = Math.min(100, Math.round((net / goalAmount) * 100));
			const bar = createProgressBar(progress);
			description += `**${item}**: ${net.toLocaleString()} / ${goalAmount.toLocaleString()} ${bar} ${progress}%\n`;
		}
	}

	if (description === '') {
		description = client.intlGet(guildId, 'resourcesNoData');
	}

	embed.setDescription(description);
	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function resourcesGoalsHandler(client, interaction, clan) {
	const guildId = interaction.guildId;

	if (!clan.goals || Object.keys(clan.goals).length === 0) {
		const str = client.intlGet(guildId, 'resourcesNoGoals');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	// Calculate current totals
	const totalDeposited = {};
	const totalWithdrawn = {};

	for (const [steamId, member] of Object.entries(clan.members)) {
		const resources = clan.resources[steamId] || { deposited: {}, withdrawn: {} };
		for (const [item, amount] of Object.entries(resources.deposited)) {
			totalDeposited[item] = (totalDeposited[item] || 0) + amount;
		}
		for (const [item, amount] of Object.entries(resources.withdrawn)) {
			totalWithdrawn[item] = (totalWithdrawn[item] || 0) + amount;
		}
	}

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'resourcesGoalsTitle')}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `${clan.tag ? `[${clan.tag}] ` : ''}${clan.name || client.intlGet(guildId, 'clanUnnamed')}` }
	});

	let description = '';
	for (const [item, goalAmount] of Object.entries(clan.goals)) {
		const net = (totalDeposited[item] || 0) - (totalWithdrawn[item] || 0);
		const progress = Math.min(100, Math.round((net / goalAmount) * 100));
		const bar = createProgressBar(progress);
		description += `**${item}**: ${net.toLocaleString()} / ${goalAmount.toLocaleString()} ${bar} ${progress}%\n`;
	}

	embed.setDescription(description);
	await client.interactionEditReply(interaction, { embeds: [embed] });
}

function createProgressBar(percent) {
	const filled = Math.floor(percent / 10);
	const empty = 10 - filled;
	return '█'.repeat(filled) + '░'.repeat(empty);
}