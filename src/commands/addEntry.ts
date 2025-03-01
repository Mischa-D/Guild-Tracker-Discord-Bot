import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { memberStatsEmbed, subguildStatsEmbed } from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import { createMember, createSubguild } from "../store.js";
import { CustomError } from "../errors/CustomError.js";

type SubCommandEnum = "member" | "guild";

const addMember: ICommand = {
  data: new SlashCommandBuilder()
    .setName("add")
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
          option.setName("guild").setDescription("Name of the guild")
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
    const { guildId, options, reply } = interaction;
    if (!guildId)
      throw new CustomError(
        "Could not associate request with a Discord server"
      );

    let embed = new EmbedBuilder();
    const name = options.getString("name", true);
    const discordIdentity = options.getUser("user")?.toString();
    const guildName = options.getString("guild") ?? undefined;
    const subCommand = options.getSubcommand() as SubCommandEnum;

    if (subCommand === "member") {
      const newMember = createMember(guildId, {
        name,
        warnings: 0,
        isActive: true,
        isBanned: false,
        discordIdentity,
        guildName,
      });

      // output
      embed = memberStatsEmbed("New Member Added", "Created Entry", newMember);
    }
    if (subCommand === "guild") {
      const newGuild = createSubguild(guildId, {
        guildName: name,
        isActive: true,
      });

      embed = subguildStatsEmbed("New Guild Added", "Created Entry", newGuild);
    }

    await reply({ embeds: [embed] });
  },
};

export default addMember;
