import { SlashCommandBuilder } from "discord.js";
import { memberStatsEmbed } from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import { createMember } from "../store.js";
import { CustomError } from "../errors/CustomError.js";

const addMember: ICommand = {
  data: new SlashCommandBuilder().setName("add").addSubcommand((option) =>
    option
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
        option.setName("guild").setDescription("Name of the guild")
      )
  ),
  async execute(interaction) {
    if (!interaction.guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const name = interaction.options.getString("name", true);
    const discordIdentity = interaction.options.getUser("user")?.toString();
    const guildName = interaction.options.getString("guild") ?? undefined;

    const newMember = createMember(interaction.guildId, {
      name,
      warnings: 0,
      isInGuild: true,
      isBanned: false,
      discordIdentity,
      guildName,
    });

    // output
    const embed = memberStatsEmbed(
      "New Member Added",
      "Created Entry",
      newMember
    );

    await interaction.reply({ embeds: [embed] });
  },
};

export default addMember;
