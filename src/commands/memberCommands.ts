import { SlashCommandBuilder } from "discord.js";
import { memberStatsEmbed } from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import { getMember, getMembersOfGuild, updateMember } from "../store.js";
import { CustomError } from "../errors/CustomError.js";
import { IUpdateMember } from "../types/IMember.js";

type SubCommandEnum = "ban" | "move" | "check" | "warn";

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
        .setName("check")
        .setDescription("view stats of a member")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("name of the member to check")
            .setAutocomplete(true)
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
    const { guildId, options, reply } = interaction;

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const memberid = options.getString("name", true);
    const subCommand = options.getSubcommand() as SubCommandEnum;
    const guildName = options.getString("guild") ?? undefined;

    const newMember: IUpdateMember = {};

    if (subCommand === "ban") {
      newMember.isBanned = true;
    }
    if (subCommand === "move") {
      newMember.guildName = guildName;
    }
    if (subCommand === "warn") {
      const { warnings = 0 } = getMember(guildId, memberid) ?? {};
      newMember.warnings = warnings + 1;
    }

    const updatedMember =
      subCommand === "check"
        ? getMember(guildId, memberid)
        : updateMember(guildId, memberid, newMember);

    const embed = memberStatsEmbed(
      "Member Updated",
      "Updated Entry",
      updatedMember
    );
    await reply({ embeds: [embed] });
  },
  async autocomplete(interaction) {
    const { guildId } = interaction;

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const membersOfGuild = getMembersOfGuild(guildId) ?? [];
    let choices = [];

    for (let i = 0; i < membersOfGuild?.length; i++) {
      choices.push({
        name: `${membersOfGuild[i].name}`,
        value: membersOfGuild[i].memberid,
      });
    }

    interaction.respond(choices).catch(console.error);
  },
};

export default addMember;
