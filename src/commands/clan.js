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

module.exports = {
	name: 'clan',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('clan')
			.setDescription(client.intlGet(guildId, 'commandsClanDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('activity')
				.setDescription(client.intlGet(guildId, 'commandsClanActivityDesc'))
				.addStringOption(option => option
					.setName('period')
					.setDescription(client.intlGet(guildId, 'commandsClanActivityPeriodDesc'))
					.setRequired(false)
					.addChoices(
						{ name: client.intlGet(guildId, 'weekly'), value: 'weekly' },
						{ name: client.intlGet(guildId, 'monthly'), value: 'monthly' },
						{ name: client.intlGet(guildId, 'alltime'), value: 'alltime' })))
			.addSubcommand(subcommand => subcommand
				.setName('leaderboard')
				.setDescription(client.intlGet(guildId, 'commandsClanLeaderboardDesc'))
				.addStringOption(option => option
					.setName('type')
					.setDescription(client.intlGet(guildId, 'commandsClanLeaderboardTypeDesc'))
					.setRequired(false)
					.addChoices(
						{ name: client.intlGet(guildId, 'onlinetime'), value: 'onlinetime' },
						{ name: client.intlGet(guildId, 'sessions'), value: 'sessions' },
						{ name: client.intlGet(guildId, 'resources'), value: 'resources' },
						{ name: client.intlGet(guildId, 'farming'), value: 'farming' })))
			.addSubcommand(subcommand => subcommand
				.setName('members')
				.setDescription(client.intlGet(guildId, 'commandsClanMembersDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('add')
				.setDescription(client.intlGet(guildId, 'commandsClanAddDesc'))
				.addStringOption(option => option
					.setName('steamid')
					.setDescription(client.intlGet(guildId, 'commandsClanAddSteamIdDesc'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('name')
					.setDescription(client.intlGet(guildId, 'commandsClanAddNameDesc'))
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('remove')
				.setDescription(client.intlGet(guildId, 'commandsClanRemoveDesc'))
				.addStringOption(option => option
					.setName('steamid')
					.setDescription(client.intlGet(guildId, 'commandsClanRemoveSteamIdDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('member')
				.setDescription(client.intlGet(guildId, 'commandsClanMemberDesc'))
				.addStringOption(option => option
					.setName('steamid')
					.setDescription(client.intlGet(guildId, 'commandsClanMemberSteamIdDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('register')
				.setDescription(client.intlGet(guildId, 'commandsClanRegisterDesc'))
				.addStringOption(option => option
					.setName('steamid')
					.setDescription(client.intlGet(guildId, 'commandsClanRegisterSteamIdDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('settings')
				.setDescription(client.intlGet(guildId, 'commandsClanSettingsDesc'))
				.addStringOption(option => option
					.setName('clan_tag')
					.setDescription(client.intlGet(guildId, 'commandsClanSettingsTagDesc'))
					.setRequired(false))
				.addStringOption(option => option
					.setName('clan_name')
					.setDescription(client.intlGet(guildId, 'commandsClanSettingsNameDesc'))
					.setRequired(false)));
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

		switch (interaction.options.getSubcommand()) {
			case 'activity': {
				await clanActivityHandler(client, interaction, instance);
			} break;

			case 'leaderboard': {
				await clanLeaderboardHandler(client, interaction, instance);
			} break;

			case 'members': {
				await clanMembersHandler(client, interaction, instance);
			} break;

			case 'add': {
				await clanAddHandler(client, interaction, instance);
			} break;

			case 'remove': {
				await clanRemoveHandler(client, interaction, instance);
			} break;

			case 'member': {
				await clanMemberHandler(client, interaction, instance);
			} break;

			case 'register': {
				await clanRegisterHandler(client, interaction, instance);
			} break;

			case 'settings': {
				await clanSettingsHandler(client, interaction, instance);
			} break;

			default: {
			} break;
		}

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${interaction.options.getSubcommand()}`
		}));
	},
};

async function clanActivityHandler(client, interaction, instance) {
	const guildId = interaction.guildId;
	const period = interaction.options.getString('period') || 'weekly';
	const clan = instance.clan;

	if (!clan || Object.keys(clan.members).length === 0) {
		const str = client.intlGet(guildId, 'clanNoMembers');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	const now = new Date();
	let startDate;
	switch (period) {
		case 'weekly':
			startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case 'monthly':
			startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
		case 'alltime':
		default:
			startDate = new Date(0);
			break;
	}

	// Calculate activity for each member
	const memberActivity = [];
	for (const [steamId, member] of Object.entries(clan.members)) {
		const activity = clan.activity[steamId] || { sessions: [], totalOnlineTime: 0 };
		let periodOnlineTime = 0;
		let periodSessions = 0;

		for (const session of activity.sessions) {
			const sessionStart = new Date(session.start);
			if (sessionStart >= startDate) {
				periodSessions++;
				const sessionEnd = session.end ? new Date(session.end) : now;
				periodOnlineTime += (sessionEnd - sessionStart) / 1000;
			}
		}

		const lastSeen = activity.lastSeen ? new Date(activity.lastSeen) : null;
		const isOnline = member.isOnline || false;

		memberActivity.push({
			steamId,
			name: member.name,
			onlineTime: periodOnlineTime,
			sessions: periodSessions,
			lastSeen: lastSeen,
			isOnline: isOnline,
			rank: 0
		});
	}

	// Sort by online time descending
	memberActivity.sort((a, b) => b.onlineTime - a.onlineTime);

	// Assign ranks
	memberActivity.forEach((member, index) => {
		member.rank = index + 1;
	});

	// Create embed
	const periodName = period === 'weekly' ? client.intlGet(guildId, 'weekly') :
		period === 'monthly' ? client.intlGet(guildId, 'monthly') : client.intlGet(guildId, 'alltime');

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'clanActivityTitle')}: ${periodName}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `${clan.tag ? `[${clan.tag}] ` : ''}${clan.name || client.intlGet(guildId, 'clanUnnamed')}` }
	});

	let description = '';
	for (const member of memberActivity.slice(0, 20)) {
		const onlineTimeStr = formatTime(member.onlineTime);
		const lastSeenStr = member.lastSeen ?
			client.intlGet(guildId, 'lastSeen', { time: DiscordTools.getDiscordFormattedDate(Math.floor(member.lastSeen.getTime() / 1000)) }) :
			client.intlGet(guildId, 'never');
		const statusIcon = member.isOnline ? ':green_circle:' : ':red_circle:';

		description += `#${member.rank} ${statusIcon} **${member.name}**\n`;
		description += `  ${client.intlGet(guildId, 'onlineTime')}: ${onlineTimeStr} | ${client.intlGet(guildId, 'sessions')}: ${member.sessions} | ${lastSeenStr}\n\n`;
	}

	if (description === '') {
		description = client.intlGet(guildId, 'clanNoActivityData');
	}

	embed.setDescription(description);

	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function clanLeaderboardHandler(client, interaction, instance) {
	const guildId = interaction.guildId;
	const type = interaction.options.getString('type') || 'onlinetime';
	const clan = instance.clan;

	if (!clan || Object.keys(clan.members).length === 0) {
		const str = client.intlGet(guildId, 'clanNoMembers');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	const now = new Date();
	const members = [];

	for (const [steamId, member] of Object.entries(clan.members)) {
		const activity = clan.activity[steamId] || { sessions: [], totalOnlineTime: 0 };
		const resources = clan.resources[steamId] || { deposited: {}, withdrawn: {}, farmed: {} };

		let totalOnlineTime = 0;
		for (const session of activity.sessions) {
			const sessionEnd = session.end ? new Date(session.end) : now;
			totalOnlineTime += (sessionEnd - new Date(session.start)) / 1000;
		}

		let totalResourcesFarmed = 0;
		for (const [item, amount] of Object.entries(resources.farmed)) {
			totalResourcesFarmed += amount;
		}

		let totalResourcesDeposited = 0;
		for (const [item, amount] of Object.entries(resources.deposited)) {
			totalResourcesDeposited += amount;
		}

		members.push({
			steamId,
			name: member.name,
			onlineTime: totalOnlineTime,
			sessions: activity.sessions.length,
			resourcesFarmed: totalResourcesFarmed,
			resourcesDeposited: totalResourcesDeposited,
			isOnline: member.isOnline || false
		});
	}

	let sortKey, title;
	switch (type) {
		case 'sessions':
			sortKey = 'sessions';
			title = client.intlGet(guildId, 'clanLeaderboardSessions');
			break;
		case 'resources':
			sortKey = 'resourcesDeposited';
			title = client.intlGet(guildId, 'clanLeaderboardResources');
			break;
		case 'farming':
			sortKey = 'resourcesFarmed';
			title = client.intlGet(guildId, 'clanLeaderboardFarming');
			break;
		case 'onlinetime':
		default:
			sortKey = 'onlineTime';
			title = client.intlGet(guildId, 'clanLeaderboardOnlineTime');
			break;
	}

	members.sort((a, b) => b[sortKey] - a[sortKey]);

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'clanLeaderboardTitle')}: ${title}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `${clan.tag ? `[${clan.tag}] ` : ''}${clan.name || client.intlGet(guildId, 'clanUnnamed')}` }
	});

	let description = '';
	for (let i = 0; i < Math.min(members.length, 20); i++) {
		const member = members[i];
		const value = member[sortKey];
		let valueStr;

		if (sortKey === 'onlineTime') {
			valueStr = formatTime(value);
		} else {
			valueStr = value.toLocaleString();
		}

		const statusIcon = member.isOnline ? ':green_circle:' : ':red_circle:';
		description += `#${i + 1} ${statusIcon} **${member.name}** - ${valueStr}\n`;
	}

	if (description === '') {
		description = client.intlGet(guildId, 'clanNoActivityData');
	}

	embed.setDescription(description);

	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function clanMembersHandler(client, interaction, instance) {
	const guildId = interaction.guildId;
	const clan = instance.clan;

	if (!clan || Object.keys(clan.members).length === 0) {
		const str = client.intlGet(guildId, 'clanNoMembers');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'clanMembersTitle')}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `${clan.tag ? `[${clan.tag}] ` : ''}${clan.name || client.intlGet(guildId, 'clanUnnamed')}` }
	});

	let description = '';
	let onlineCount = 0;
	let offlineCount = 0;

	for (const [steamId, member] of Object.entries(clan.members)) {
		const activity = clan.activity[steamId] || {};
		const isOnline = member.isOnline || false;
		const statusIcon = isOnline ? ':green_circle:' : ':red_circle:';
		if (isOnline) onlineCount++; else offlineCount++;

		const lastSeen = activity.lastSeen ?
			client.intlGet(guildId, 'lastSeen', { time: DiscordTools.getDiscordFormattedDate(Math.floor(new Date(activity.lastSeen).getTime() / 1000)) }) :
			client.intlGet(guildId, 'never');

		description += `${statusIcon} **${member.name}** (${steamId})\n`;
		description += `  ${lastSeen}\n\n`;
	}

	description = `${client.intlGet(guildId, 'clanTotalMembers', { total: Object.keys(clan.members).length, online: onlineCount, offline: offlineCount })}\n\n` + description;

	embed.setDescription(description);

	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function clanAddHandler(client, interaction, instance) {
	const guildId = interaction.guildId;
	const steamId = interaction.options.getString('steamid');
	const name = interaction.options.getString('name') || `Player_${steamId.slice(-6)}`;
	const clan = instance.clan;

	// Validate SteamID64
	if (!/^\d{17}$/.test(steamId)) {
		const str = client.intlGet(guildId, 'invalidSteamId');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	if (clan.members[steamId]) {
		const str = client.intlGet(guildId, 'clanMemberAlreadyExists', { name: clan.members[steamId].name });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	clan.members[steamId] = {
		name: name,
		steamId: steamId,
		joinedAt: new Date().toISOString(),
		isOnline: false,
		role: 'member'
	};

	clan.activity[steamId] = {
		sessions: [],
		totalOnlineTime: 0,
		lastSeen: null
	};

	clan.resources[steamId] = {
		deposited: {},
		withdrawn: {},
		farmed: {},
		history: []
	};

	client.setInstance(guildId, instance);

	const str = client.intlGet(guildId, 'clanMemberAdded', { name: name, steamId: steamId });
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(null, 'infoCap'), str);
}

async function clanRemoveHandler(client, interaction, instance) {
	const guildId = interaction.guildId;
	const steamId = interaction.options.getString('steamid');
	const clan = instance.clan;

	if (!clan.members[steamId]) {
		const str = client.intlGet(guildId, 'clanMemberNotFound', { steamId: steamId });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	const name = clan.members[steamId].name;
	delete clan.members[steamId];
	delete clan.activity[steamId];
	delete clan.resources[steamId];

	client.setInstance(guildId, instance);

	const str = client.intlGet(guildId, 'clanMemberRemoved', { name: name, steamId: steamId });
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(null, 'infoCap'), str);
}

async function clanMemberHandler(client, interaction, instance) {
	const guildId = interaction.guildId;
	const steamId = interaction.options.getString('steamid');
	const clan = instance.clan;

	if (!clan.members[steamId]) {
		const str = client.intlGet(guildId, 'clanMemberNotFound', { steamId: steamId });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	const member = clan.members[steamId];
	const activity = clan.activity[steamId] || { sessions: [], totalOnlineTime: 0 };
	const resources = clan.resources[steamId] || { deposited: {}, withdrawn: {}, farmed: {}, history: [] };

	const now = new Date();
	let totalOnlineTime = 0;
	for (const session of activity.sessions) {
		const sessionEnd = session.end ? new Date(session.end) : now;
		totalOnlineTime += (sessionEnd - new Date(session.start)) / 1000;
	}

	const lastSeen = activity.lastSeen ?
		client.intlGet(guildId, 'lastSeen', { time: DiscordTools.getDiscordFormattedDate(Math.floor(new Date(activity.lastSeen).getTime() / 1000)) }) :
		client.intlGet(guildId, 'never');

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(guildId, 'clanMemberInfo')}: ${member.name}`,
		color: DiscordEmbeds.COLOR_DEFAULT,
		footer: { text: `SteamID: ${steamId}` }
	});

	let description = `__**${client.intlGet(guildId, 'general')}**__\n`;
	description += `${client.intlGet(guildId, 'steamId')}: ${steamId}\n`;
	description += `${client.intlGet(guildId, 'role')}: ${member.role}\n`;
	description += `${client.intlGet(guildId, 'joinedAt')}: ${DiscordTools.getDiscordFormattedDate(Math.floor(new Date(member.joinedAt).getTime() / 1000))}\n`;
	description += `${client.intlGet(guildId, 'status')}: ${member.isOnline ? client.intlGet(guildId, 'online') : client.intlGet(guildId, 'offline')}\n`;
	description += `${client.intlGet(guildId, 'lastSeen')}: ${lastSeen}\n\n`;

	description += `__**${client.intlGet(guildId, 'activity')}**__\n`;
	description += `${client.intlGet(guildId, 'totalOnlineTime')}: ${formatTime(totalOnlineTime)}\n`;
	description += `${client.intlGet(guildId, 'totalSessions')}: ${activity.sessions.length}\n\n`;

	description += `__**${client.intlGet(guildId, 'resources')}**__\n`;
	let totalDeposited = 0, totalWithdrawn = 0, totalFarmed = 0;
	for (const [item, amount] of Object.entries(resources.deposited)) {
		description += `${item}: +${amount} (${client.intlGet(guildId, 'deposited')})\n`;
		totalDeposited += amount;
	}
	for (const [item, amount] of Object.entries(resources.withdrawn)) {
		description += `${item}: -${amount} (${client.intlGet(guildId, 'withdrawn')})\n`;
		totalWithdrawn += amount;
	}
	for (const [item, amount] of Object.entries(resources.farmed)) {
		description += `${item}: ${amount} (${client.intlGet(guildId, 'farmed')})\n`;
		totalFarmed += amount;
	}
	description += `\n${client.intlGet(guildId, 'totalDeposited')}: ${totalDeposited} | ${client.intlGet(guildId, 'totalWithdrawn')}: ${totalWithdrawn} | ${client.intlGet(guildId, 'totalFarmed')}: ${totalFarmed}`;

	embed.setDescription(description);

	await client.interactionEditReply(interaction, { embeds: [embed] });
}

async function clanRegisterHandler(client, interaction, instance) {
	const guildId = interaction.guildId;
	const steamId = interaction.options.getString('steamid');
	const clan = instance.clan;
	const userId = interaction.user.id;

	// Validate SteamID64
	if (!/^\d{17}$/.test(steamId)) {
		const str = client.intlGet(guildId, 'invalidSteamId');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		return;
	}

	// Check if this Discord user already has a registered SteamID
	for (const [existingSteamId, member] of Object.entries(clan.members)) {
		if (member.discordId === userId) {
			const str = client.intlGet(guildId, 'clanAlreadyRegistered', { name: member.name });
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			return;
		}
	}

	// Check if SteamID is already registered
	if (clan.members[steamId]) {
		// Link to existing member
		clan.members[steamId].discordId = userId;
		client.setInstance(guildId, instance);
		const str = client.intlGet(guildId, 'clanLinkedExisting', { name: clan.members[steamId].name });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
		return;
	}

	// Create new member entry
	clan.members[steamId] = {
		name: `Player_${steamId.slice(-6)}`,
		steamId: steamId,
		discordId: userId,
		joinedAt: new Date().toISOString(),
		isOnline: false,
		role: 'member'
	};

	clan.activity[steamId] = {
		sessions: [],
		totalOnlineTime: 0,
		lastSeen: null
	};

	clan.resources[steamId] = {
		deposited: {},
		withdrawn: {},
		farmed: {},
		history: []
	};

	client.setInstance(guildId, instance);

	const str = client.intlGet(guildId, 'clanRegistered', { steamId: steamId });
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(null, 'infoCap'), str);
}

async function clanSettingsHandler(client, interaction, instance) {
	const guildId = interaction.guildId;
	const clanTag = interaction.options.getString('clan_tag');
	const clanName = interaction.options.getString('clan_name');
	const clan = instance.clan;

	if (clanTag !== null) {
		clan.tag = clanTag.toUpperCase().substring(0, 10);
	}

	if (clanName !== null) {
		clan.name = clanName.substring(0, 50);
	}

	client.setInstance(guildId, instance);

	const str = client.intlGet(guildId, 'clanSettingsUpdated', {
		tag: clan.tag || client.intlGet(guildId, 'notSet'),
		name: clan.name || client.intlGet(guildId, 'notSet')
	});
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(null, 'infoCap'), str);
}

function formatTime(seconds) {
	if (seconds < 60) return `${Math.floor(seconds)}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	return `${days}d ${hours}h`;
}