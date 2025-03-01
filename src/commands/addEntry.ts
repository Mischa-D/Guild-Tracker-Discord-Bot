import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import {
  createEmbedTemplate,
  memberStatsEmbed,
  subguildStatsEmbed,
} from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import { createMember, createSubguild } from "../store.js";
import { CustomError } from "../errors/CustomError.js";
import { guildAutocomplete } from "../utils/autocomplete/guildAutocomplete.js";

type SubCommandEnum = "member" | "guild";

const addMember: ICommand = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("create a new guild or member entry")
    .addSubcommand((option) =>
      option
        .setName("member")
        .setDescription("add a guild member")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("IGN of the guild member")
            .setRequired(true)
        )
        .addUserOption((option) =>
          option.setName("user").setDescription("Name on discord")
        )
        .addStringOption((option) =>
          option
            .setName("guild")
            .setDescription("Name of the guild")
            .setAutocomplete(true)
        )
    )
    .addSubcommand((option) =>
      option
        .setName("guild")
        .setDescription("add a guild to this server")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Name of the guild")
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const { guildId, options } = interaction;
    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    let embed: Promise<EmbedBuilder>;
    const name = options.getString("name", true);
    const discordIdentity = options.getUser("user")?.toString();
    const guildName = options.getString("guild") ?? undefined;
    const subCommand = options.getSubcommand() as SubCommandEnum;

    switch (subCommand) {
      case "member":
        const newMember = await createMember(guildId, {
          name,
          warnings: 0,
          isActive: true,
          isBanned: false,
          discordIdentity,
          guildName,
        });

        embed = memberStatsEmbed(
          "New Member Added",
          "Created Entry",
          newMember
        );
        break;
      case "guild":
        const newGuild = await createSubguild(guildId, {
          guildName: name,
          isActive: true,
          members: [],
        });
        embed = subguildStatsEmbed(
          "New Guild Added",
          "Created Entry",
          newGuild
        );
        break;

      default:
        embed = createEmbedTemplate();
        break;
    }

    await interaction.reply({
      embeds: [await embed],
    });
  },
  async autocomplete(interaction) {
    const { guildId } = interaction;
    const { value } = interaction.options.getFocused(true);

    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const choices = await guildAutocomplete(guildId, value);
    interaction.respond(choices).catch(console.error);
  },
};

export default addMember;
