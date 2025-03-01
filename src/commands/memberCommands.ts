import {
  ApplicationCommandOptionChoiceData,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { memberStatsEmbed } from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import { getMember, moveGuildMember, updateMember } from "../store.js";
import { CustomError } from "../errors/CustomError.js";
import { IUpdateMember } from "../types/IMember.js";
import { guildAutocomplete } from "../utils/autocomplete/guildAutocomplete.js";
import { memberAutocomplete } from "../utils/autocomplete/memberAutocomplete.js";
import { WARN_THRESHOLD } from "../constants.js";
import { ObjectId } from "mongodb";

type SubCommandEnum = "ban" | "unban" | "move" | "check" | "warn" | "unwarn";
type AutocompleteOptionsEnum = "name" | "guild";

const addMember: ICommand = {
  data: new SlashCommandBuilder()
    .setName("member")
    .setDescription("commands related to a member")
    .addSubcommand((option) =>
      option
        .setName("ban")
        .setDescription("mark a member as unwanted")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("name of the member to ban")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((option) =>
      option
        .setName("unban")
        .setDescription("revert a ban")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("name of the member to unban")
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
            .setAutocomplete(true)
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
    )
    .addSubcommand((option) =>
      option
        .setName("unwarn")
        .setDescription("decrease the warning count by one")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("name of the member to unwarn")
            .setAutocomplete(true)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const { guildId, options } = interaction;

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const memberid = new ObjectId(options.getString("name", true));
    const subCommand = options.getSubcommand() as SubCommandEnum;

    const newMember: IUpdateMember = {};

    switch (subCommand) {
      case "ban": {
        newMember.isBanned = true;
        break;
      }
      case "unban": {
        newMember.isBanned = false;
        break;
      }
      case "move": {
        const subguildId = new ObjectId(options.getString("guild", true));
        const subguild = await moveGuildMember(guildId, subguildId, memberid);
        newMember.guildName = subguild.guildName;
        break;
      }
      case "warn": {
        const { warnings = 0, isBanned } =
          (await getMember(guildId, memberid)) ?? {};
        if (!isBanned)
          newMember.warnings = Math.min(warnings + 1, WARN_THRESHOLD);
        break;
      }
      case "unwarn": {
        const { warnings = 0, isBanned } =
          (await getMember(guildId, memberid)) ?? {};
        if (!isBanned) newMember.warnings = Math.max(warnings - 1, 0);
        break;
      }
      default:
        break;
    }

    let embed: EmbedBuilder;
    if (subCommand === "check") {
      const member = await getMember(guildId, memberid);
      embed = await memberStatsEmbed(`${member.name}`, "Showing Entry", member);
    } else {
      const updatedMember = await updateMember(guildId, memberid, newMember);
      embed = await memberStatsEmbed(
        "Member Updated",
        "Updated Entry",
        updatedMember
      );
    }

    await interaction.reply({ embeds: [embed] });
  },
  async autocomplete(interaction, latestInteraction) {
    const { guildId } = interaction;
    const { name: optionName, value } = interaction.options.getFocused(
      true
    ) as {
      name: AutocompleteOptionsEnum;
      value: string;
    };
    let choices: ApplicationCommandOptionChoiceData[] = [];

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    switch (optionName) {
      case "name":
        choices = await memberAutocomplete(guildId, value);
        break;
      case "guild":
        choices = await guildAutocomplete(guildId, value);
        break;

      default:
        break;
    }

    console.log(choices);
    if (interaction !== latestInteraction) {
      console.log("caught");
      return;
    }
    interaction.respond(choices).catch(console.error);
  },
};

export default addMember;
