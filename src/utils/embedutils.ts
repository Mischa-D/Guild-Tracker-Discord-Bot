import { EmbedBuilder } from "discord.js";
import { IMember } from "../types/IMember.js";
import { ISubguild } from "../types/IGuild.js";

export const createEmbedTemplate = async () => {
  const embed = new EmbedBuilder()
    .setColor("#3837b9")
    .setTimestamp()
    .setFooter({
      text: "by Lagopus#4584",
      iconURL: "https://i.imgur.com/mQ4hMwD.jpeg",
    });

  return embed;
};

export const memberStatsEmbed = async (
  title: string,
  description: string,
  member: IMember
) => {
  const { name, discordIdentity, guildName, warnings, isBanned } = member;
  const embed = await createEmbedTemplate();
  embed.setTitle(title);
  embed.setDescription(`${description} for Member ${name}`);

  discordIdentity &&
    embed.addFields({ name: "Discord Username", value: discordIdentity });
  guildName && embed.addFields({ name: "In Guild", value: guildName });
  isBanned
    ? embed.addFields({
        name: `is banned from your guild(s)`,
        value: "\u200B",
      })
    : embed.addFields({ name: `has ${warnings} warnings`, value: "\u200B" });

  return embed;
};

export const subguildStatsEmbed = async (
  title: string,
  description: string,
  subguild: ISubguild
) => {
  const { guildName } = subguild;
  const embed = await createEmbedTemplate();
  embed.setTitle(title);
  embed.setDescription(`${description} for Guild ${guildName}`);

  embed.addFields({ name: "Membercount", value: `${subguild.members.length}` }); // TODO: real membercount

  return embed;
};
