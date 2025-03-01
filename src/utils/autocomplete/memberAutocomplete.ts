import { getMembersOfGuild } from "../../store.js";

export const memberAutocomplete = (guildId: string, value: string) => {
  const membersOfGuild = getMembersOfGuild(guildId) ?? [];
  const choices = membersOfGuild
    .filter((member) => member.name.includes(value))
    .map((member) => ({ name: member.name, value: member.memberid }));

  return choices;
};
