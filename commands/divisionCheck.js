const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDivisionVotes } = require('../functions/reddit');
const { getMpsAgainstWhip, getMpsComplyWhip, getMpsDnv } = require('../functions/whip');
const { Division } = require('../functions/utils');
const escape = require('markdown-escape');

const Commands = {
    Commons: 'commons',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote-check')
        .setDescription('Check the status of an open division.')
        .addSubcommand(subcommand =>
            subcommand
                .setName(Commands.Commons)
                .setDescription('Checks commons division')
                .addStringOption(option => option.setName('reddit_id').setDescription('Reddit URL ID (5 chars in URL)').setRequired(true))
                .addStringOption(option => option.setName('whip').setDescription('Aye/No/Abs').setRequired(true).setChoices(
                    { name: 'Aye', value: 'aye' },
                    { name: 'No', value: 'no' },
                    { name: 'Abstain', value: 'abs' },
                ))),
    async execute(interaction) {
        await interaction.deferReply();
        const redditId = interaction.options.get('reddit_id').value;
        const whip = interaction.options.get('whip').value;

        const division = await getDivisionVotes(redditId);
        if (!(division instanceof Division)) {
            await interaction.editReply('Operation failed. Check the vote ID is correct.');
            return;
        }

        const mpsAgainstWhip = getMpsAgainstWhip(division, whip);
        const mpsComplyWhip = getMpsComplyWhip(division, whip);
        const mpsDnv = await getMpsDnv(division);

        let fieldComplyValue = '';
        mpsComplyWhip.forEach(mp => fieldComplyValue += `${escape(mp[0])} \n`);
        if (fieldComplyValue === '') fieldComplyValue = 'None';

        let fieldAgainstValue = '';
        mpsAgainstWhip.forEach(mp => fieldAgainstValue += `${escape(mp[0])} (${mp[1]}) \n`);
        if (fieldAgainstValue === '') fieldAgainstValue = 'None';

        let fieldDnvValue = '';
        mpsDnv.forEach(mp => fieldDnvValue += `${escape(mp)} \n`);
        if (fieldDnvValue === '') fieldDnvValue = 'None';

        const responseEmbed = new EmbedBuilder()
            .setTitle(`Status of division ${division.id} (${division.url})`)
            .setDescription(`Requested whip is **${whip.toUpperCase()}**. ${division.comments.length.toString()} votes so far.`)
            .addFields(
                { name: 'Complying:', value: fieldComplyValue },
                { name: 'Against:', value: fieldAgainstValue },
                { name: 'DNV', value: fieldDnvValue },
            );

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};