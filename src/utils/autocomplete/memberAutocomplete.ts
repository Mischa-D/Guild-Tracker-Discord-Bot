import { ApplicationCommandOptionChoiceData } from "discord.js";
import { getAllMembers } from "../../store.js";

export const memberAutocomplete = async (
  guildId: string,
  value: string
): Promise<ApplicationCommandOptionChoiceData[]> => {
  const membersOfGuild = (await getAllMembers(guildId)) ?? [];
  const choices = membersOfGuild
    .filter((member) => member.name.includes(value))
    .map((member) => ({ name: member.name, value: member._id.toString() }));

  return choices;
};
