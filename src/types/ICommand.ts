import {
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { WithGuildId } from "./WithGuildId.js";

export interface ICommand {
  data:
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (
    interaction: WithGuildId<ChatInputCommandInteraction<CacheType>>
  ) => Promise<void>;
  autocomplete?: (
    interaction: WithGuildId<AutocompleteInteraction<CacheType>>
  ) => Promise<void>;
}
