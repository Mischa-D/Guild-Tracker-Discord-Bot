import { SlashCommandBuilder } from "discord.js";
import { createEmbedTemplate } from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import { createMember, MemberCollectionPerGuild } from "../store.js";
import { CustomError } from "../errors/CustomError.js";
import { IMember, ISaveMember } from "../types/IMember.js";
import { v6 as generateUuid } from "uuid";

const addMember: ICommand = {
  data: new SlashCommandBuilder()
    .setName("add")
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
    ),

  async execute(interaction) {
    if (!interaction.guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    const name = interaction.options.getString("name", true);
    const discordIdentity = interaction.options.getUser("user")?.toString();
    const guildName = interaction.options.getString("guild") ?? undefined;

    const newMember: ISaveMember = {
      name,
      warnings: 0,
      isInGuild: true,
      isBanned: false,
      discordIdentity,
      guildName,
    };
    createMember(interaction.guildId, newMember);

    // output
    const embed = createEmbedTemplate();
    embed.setTitle("New Member Added");
    embed.setDescription(`Created Entry for Member ${name}`);

    discordIdentity &&
      embed.addFields({ name: "Discord Username", value: discordIdentity });
    guildName && embed.addFields({ name: "In Guild", value: guildName });
    embed.addFields({ name: `has ${0} warnings`, value: "\u200B" });

    await interaction.reply({ embeds: [embed] });
  },
};

export default addMember;
