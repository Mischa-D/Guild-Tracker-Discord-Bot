import { getSubguildsOfGuild } from "../../store.js";

export const guildAutocomplete = (guildId: string, value: string) => {
  const subguildsOfGuild = getSubguildsOfGuild(guildId) ?? [];
  const choices = subguildsOfGuild
    .filter((subguild) => subguild.guildName.includes(value))
    .map((subguild) => ({
      name: subguild.guildName,
      value: subguild.guildId,
    }));

  return choices;
};
