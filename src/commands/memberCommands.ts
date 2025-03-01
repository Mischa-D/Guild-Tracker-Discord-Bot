import {
  ApplicationCommandOptionChoiceData,
  SlashCommandBuilder,
} from "discord.js";
import { memberStatsEmbed } from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import {
  getMember,
  getMembersOfGuild,
  getSubguildsOfGuild,
  moveGuildMember,
  updateMember,
} from "../store.js";
import { CustomError } from "../errors/CustomError.js";
import { IUpdateMember } from "../types/IMember.js";

type SubCommandEnum = "ban" | "move" | "check" | "warn";
type AutocompleteOptionsEnum = "name" | "guild";

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
    const { guildId, options, reply } = interaction;

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const memberid = options.getString("name", true);
    const subCommand = options.getSubcommand() as SubCommandEnum;

    const newMember: IUpdateMember = {};

    if (subCommand === "ban") {
      newMember.isBanned = true;
    }
    if (subCommand === "move") {
      const subguildId = options.getString("guild", true);
      const subguild = moveGuildMember(guildId, subguildId, memberid);
      newMember.guildName = subguild.guildName;
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
    const {
      guildId,
      options: { getFocused },
    } = interaction;
    const { name: optionName, value } = getFocused(true) as {
      name: AutocompleteOptionsEnum;
      value: string;
    };
    let choices: ApplicationCommandOptionChoiceData[] = [];

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    if (optionName === "name") {
      const membersOfGuild = getMembersOfGuild(guildId) ?? [];
      choices = membersOfGuild
        .filter((member) => member.name.includes(value))
        .map((member) => ({ name: member.name, value: member.memberid }));
    }

    if (optionName === "guild") {
      const subguildsOfGuild = getSubguildsOfGuild(guildId) ?? [];
      choices = subguildsOfGuild
        .filter((subguild) => subguild.guildName.includes(value))
        .map((subguild) => ({
          name: subguild.guildName,
          value: subguild.guildId,
        }));
    }

    interaction.respond(choices).catch(console.error);
  },
};

export default addMember;
