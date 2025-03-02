import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import {
  createEmbedTemplate,
  settingsEmbed,
} from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import { CustomError } from "../errors/CustomError.js";
import { setWarnThreshold } from "../store/settings.js";

type SubCommandEnum = "warnings";

const settings: ICommand = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("change settings for this server")
    .addSubcommand((option) =>
      option
        .setName("warnings")
        .setDescription("settings related to warnings")
        .addIntegerOption((option) =>
          option
            .setName("limit")
            .setDescription("upper limit for warnings")
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

    let embed: Promise<EmbedBuilder>;
    const limit = options.getInteger("limit", true);
    const subCommand = options.getSubcommand() as SubCommandEnum;
    console.log(subCommand);

    switch (subCommand) {
      case "warnings":
        const settings = await setWarnThreshold(guildId, limit);
        embed = settingsEmbed(
          "Server Settings",
          `changed warn limit to ${limit}`,
          settings
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
};

export default settings;
