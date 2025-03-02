import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import {
  createEmbedTemplate,
  membersListEmbed,
  subguildStatsEmbed,
} from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import { getMembersOfSubguild, moveAllGuildMembersFrom } from "../store.js";
import { CustomError } from "../errors/CustomError.js";
import { guildAutocomplete } from "../utils/autocomplete/guildAutocomplete.js";
import { ISubguild } from "../types/IGuild.js";
import { ObjectId } from "mongodb";

type SubCommandEnum = "moveAll" | "check";

const addMember: ICommand = {
  data: new SlashCommandBuilder()
    .setName("guild")
    .setDescription("commands related to a guild")
    .addSubcommand((option) =>
      option
        .setName("check")
        .setDescription("view members of a guild")
        .addStringOption((option) =>
          option
            .setName("guild")
            .setDescription("name of the guild to check")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((option) =>
      option
        .setName("moveall")
        .setDescription("move all members of one guild to another")
        .addStringOption((option) =>
          option
            .setName("guild")
            .setDescription("move members of this guild")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("target")
            .setDescription("move everyone to this guild")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions("0"),
  async execute(interaction) {
    const { guildId, options } = interaction;

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const subguildId = new ObjectId(options.getString("guild", true));
    const subCommand = options.getSubcommand() as SubCommandEnum;

    let embed: Promise<EmbedBuilder>;
    let subguild: ISubguild;

    switch (subCommand) {
      case "moveAll":
        const targetSubguildId = new ObjectId(options.getString("target", true));
        subguild = await moveAllGuildMembersFrom(
          guildId,
          subguildId,
          targetSubguildId
        );
        embed = subguildStatsEmbed(
          "Guild Updated",
          "Updated Members",
          subguild
        );
        break;
      case "check":
        const members = await getMembersOfSubguild(guildId, subguildId);
        const subguildName = (members.length ? members[0].guildName : "") ?? "";
        embed = membersListEmbed(subguildName, members);
      default:
        embed = createEmbedTemplate();
        break;
    }

    await interaction.reply({ embeds: [await embed] });
  },
  async autocomplete(interaction, latestInteraction) {
    const { guildId } = interaction;
    const { value } = interaction.options.getFocused(true);

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const choices = await guildAutocomplete(guildId, value);

    if (interaction !== latestInteraction) return;
    interaction.respond(choices).catch(console.error);
  },
};

export default addMember;
