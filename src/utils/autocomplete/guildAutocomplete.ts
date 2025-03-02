import { ApplicationCommandOptionChoiceData } from "discord.js";
import { getAllSubguilds } from "../../store/store.js";

export const guildAutocomplete = async (
  guildId: string,
  value: string
): Promise<ApplicationCommandOptionChoiceData[]> => {
  const subguildsOfGuild = (await getAllSubguilds(guildId)) ?? [];

  const choices = subguildsOfGuild
    .filter((subguild) => subguild.guildName.includes(value))
    .map((subguild) => ({
      name: subguild.guildName,
      value: subguild._id.toString(),
    }));

  return choices;
};
