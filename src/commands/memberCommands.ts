import { SlashCommandBuilder } from "discord.js";
import { createEmbedTemplate } from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import {
  createMember,
  getMember,
  getMembersOfGuild,
  updateMember,
} from "../store.js";
import { CustomError } from "../errors/CustomError.js";
import { ISaveMember, IUpdateMember } from "../types/IMember.js";

type SubCommandEnum = "ban" | "move" | "warn";

const addMember: ICommand = {
  data: new SlashCommandBuilder()
    .setName("member")
    .addSubcommand((option) =>
      option
        .setName("ban")
        .setDescription("mark a member as unwanted")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("name of the member to kick")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((option) =>
      option
        .setName("move")
        .setDescription("move member to a different guild")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("name of the member to move")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("guild")
            .setDescription("move member to guild with name")
            .setRequired(true)
        )
    )
    .addSubcommand((option) =>
      option
        .setName("warn")
        .setDescription("increase the warning count by one")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("name of the member to warn")
            .setAutocomplete(true)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!interaction.guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const memberid = interaction.options.getString("name", true);
    const subCommand = interaction.options.getSubcommand() as SubCommandEnum;
    const guildName = interaction.options.getString("guild") ?? undefined;

    const newMember: IUpdateMember = {};

    if (subCommand === "ban") {
      newMember.isBanned = true;
    }
    if (subCommand === "move") {
      newMember.guildName = guildName;
    }
    if (subCommand === "warn") {
      const { warnings = 0 } = getMember(interaction.guildId, memberid) ?? {};
      newMember.warnings = warnings + 1;
    }

    const { discordIdentity, warnings, isBanned } = updateMember(
      interaction.guildId,
      memberid,
      newMember
    );

    // output
    const embed = createEmbedTemplate();
    embed.setTitle("Member Updated");
    embed.setDescription(`Updated Entry for Member ${name}`);

    discordIdentity &&
      embed.addFields({ name: "Discord Username", value: discordIdentity });
    guildName && embed.addFields({ name: "In Guild", value: guildName });
    isBanned
      ? embed.addFields({ name: `has ${warnings} warnings`, value: "\u200B" })
      : embed.addFields({
          name: `is banned from your guild(s)`,
          value: "\u200B",
        });
    await interaction.reply({ embeds: [embed] });
  },
  async autocomplete(interaction) {
    if (!interaction.guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const membersOfGuild = getMembersOfGuild(interaction.guildId) ?? [];
    let choices = [];

    for (let i = 0; i < membersOfGuild?.length; i++) {
      choices.push({
        name: `${membersOfGuild[i].name}`,
        value: membersOfGuild[i].memberid,
      });
    }

    if (interaction.isAutocomplete()) {
      interaction.respond(choices).catch(console.error);
    }
  },
};

export default addMember;
