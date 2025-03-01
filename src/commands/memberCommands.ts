import {
  ApplicationCommandOptionChoiceData,
  SlashCommandBuilder,
} from "discord.js";
import { memberStatsEmbed } from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import { getMember, moveGuildMember, updateMember } from "../store.js";
import { CustomError } from "../errors/CustomError.js";
import { IUpdateMember } from "../types/IMember.js";
import { guildAutocomplete } from "../utils/autocomplete/guildAutocomplete.js";
import { memberAutocomplete } from "../utils/autocomplete/memberAutocomplete.js";

type SubCommandEnum = "ban" | "move" | "check" | "warn";
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
    ),

  async execute(interaction) {
    const { guildId, options } = interaction;

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const memberid = options.getString("name", true);
    const subCommand = options.getSubcommand() as SubCommandEnum;

    const newMember: IUpdateMember = {};

    switch (subCommand) {
      case "ban":
        newMember.isBanned = true;
        break;
      case "move":
        const subguildId = options.getString("guild", true);
        const subguild = moveGuildMember(guildId, subguildId, memberid);
        newMember.guildName = subguild.guildName;
        break;
      case "warn":
        const { warnings = 0, isBanned } = getMember(guildId, memberid) ?? {};
        if (!isBanned) newMember.warnings = warnings + 1;
        break;
      default:
        break;
    }

    const updatedMember =
      subCommand === "check"
        ? getMember(guildId, memberid)
        : updateMember(guildId, memberid, newMember);

    const embed = await memberStatsEmbed(
      "Member Updated",
      "Updated Entry",
      updatedMember
    );
    await interaction.reply({ embeds: [embed] });
  },
  async autocomplete(interaction) {
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
        choices = memberAutocomplete(guildId, value);
        break;
      case "guild":
        choices = guildAutocomplete(guildId, value);
        break;

      default:
        break;
    }

    interaction.respond(choices).catch(console.error);
  },
};

export default addMember;
