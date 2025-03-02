import {
  ApplicationCommandOptionChoiceData,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { memberStatsEmbed } from "../utils/embedutils.js";
import { ICommand } from "../types/ICommand.js";
import {
  getMember,
  modifyWarnings,
  moveGuildMember,
  removeFromAllGuilds,
  updateMember,
} from "../store/store.js";
import { CustomError } from "../errors/CustomError.js";
import { IMember, IUpdateMember } from "../types/IMember.js";
import { guildAutocomplete } from "../utils/autocomplete/guildAutocomplete.js";
import { memberAutocomplete } from "../utils/autocomplete/memberAutocomplete.js";
import { ObjectId } from "mongodb";
import { autocompleteInteractionCollection } from "../utils/command-handler.js";

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
    )
    .setDefaultMemberPermissions("0"),

  async execute(interaction) {
    const { guildId, options } = interaction;

    const memberid = new ObjectId(options.getString("name", true));
    const subCommand = options.getSubcommand() as SubCommandEnum;
    console.log(subCommand);

    const newMember: IUpdateMember = {};
    let member: IMember;

    switch (subCommand) {
      case "ban": {
        newMember.isBanned = true;
        newMember.guildName = undefined;
        member = await updateMember(guildId, memberid, newMember);
        removeFromAllGuilds(guildId, memberid);
        break;
      }
      case "unban": {
        newMember.isBanned = false;
        member = await updateMember(guildId, memberid, newMember);
        break;
      }
      case "move": {
        const subguildId = new ObjectId(options.getString("guild", true));
        member = await moveGuildMember(guildId, subguildId, memberid);
        break;
      }
      case "warn": {
        member = await modifyWarnings(guildId, memberid, 1);
        break;
      }
      case "unwarn": {
        member = await modifyWarnings(guildId, memberid, -1);
        break;
      }
      case "check":
      default:
        member = await getMember(guildId, memberid);
        break;
    }

    let embed: Promise<EmbedBuilder>;
    if (subCommand === "check") {
      embed = memberStatsEmbed(`${member.name}`, "Showing Entry", member);
    } else {
      embed = memberStatsEmbed("Member Updated", "Updated Entry", member);
    }

    await interaction.reply({ embeds: [await embed] });
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
        choices = await memberAutocomplete(guildId, value);
        break;
      case "guild":
        choices = await guildAutocomplete(guildId, value);
        break;

      default:
        break;
    }

    const latestInteraction = autocompleteInteractionCollection.get(guildId);
    autocompleteInteractionCollection.set(guildId, null);
    latestInteraction &&
      (await latestInteraction.respond(choices).catch(console.error));
  },
};

export default addMember;
