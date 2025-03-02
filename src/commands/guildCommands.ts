import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import {
  createEmbedTemplate,
  membersListEmbed,
  subguildStatsEmbed,
} from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import { getSubguild, moveAllGuildMembersFrom } from "../store/store.js";
import { CustomError } from "../errors/CustomError.js";
import { guildAutocomplete } from "../utils/autocomplete/guildAutocomplete.js";
import { ISubguild } from "../types/IGuild.js";
import { ObjectId } from "mongodb";
import { autocompleteInteractionCollection } from "../utils/command-handler.js";
import { getSettings } from "../store/settings.js";

type SubCommandEnum = "moveall" | "check";

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

    const subguildId = new ObjectId(options.getString("guild", true));
    const subCommand = options.getSubcommand() as SubCommandEnum;
    console.log(subCommand);

    let embed: Promise<EmbedBuilder>;
    let subguild: ISubguild;

    switch (subCommand) {
      case "moveall":
        const targetSubguildId = new ObjectId(
          options.getString("target", true)
        );
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
        const { members, guildName } = await getSubguild(guildId, subguildId);
        const {warnLimit} = await getSettings(guildId);
        embed = membersListEmbed(guildName, members, warnLimit);
        break;
      default:
        embed = createEmbedTemplate();
        break;
    }

    await interaction.reply({ embeds: [await embed] });
  },
  async autocomplete(interaction) {
    const { guildId } = interaction;
    const { value } = interaction.options.getFocused(true);

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const choices = await guildAutocomplete(guildId, value);

    const latestInteraction = autocompleteInteractionCollection.get(guildId);
    autocompleteInteractionCollection.set(guildId, null);
    latestInteraction &&
      (await latestInteraction.respond(choices).catch(console.error));
  },
};

export default addMember;
