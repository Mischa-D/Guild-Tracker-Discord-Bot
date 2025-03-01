import {
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Interaction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface ICommand {
  data:
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (
    interaction: ChatInputCommandInteraction<CacheType>
  ) => Promise<void>;
  autocomplete?: (
    interaction: AutocompleteInteraction<CacheType>,
    latestInteraction: Interaction<CacheType>
  ) => Promise<void>;
}
