import { ApplicationCommandOptionChoiceData } from "discord.js";
import { getAllSubguilds } from "../../store.js";

export const guildAutocomplete = async (
  guildId: string,
  value: string
): Promise<ApplicationCommandOptionChoiceData[]> => {
  const subguildsOfGuild = (await getAllSubguilds(guildId)) ?? [];
  
  console.log(subguildsOfGuild)
  const choices = subguildsOfGuild
    .filter((subguild) => subguild.guildName.includes(value))
    .map((subguild) => ({
      name: subguild.guildName,
      value: subguild._id.toString(),
    }));

  console.log(choices);
  return choices;
};
