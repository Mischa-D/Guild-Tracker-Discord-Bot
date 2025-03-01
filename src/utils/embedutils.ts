import { EmbedBuilder, UserMention } from "discord.js";
import { IMember } from "../types/IMember.js";
import { ISubguild } from "../types/IGuild.js";

export const createEmbedTemplate = () => {
  const embed = new EmbedBuilder()
    .setColor("#3837b9")
    .setTimestamp()
    .setFooter({
      text: "by Lagopus#4584",
      iconURL: "https://i.imgur.com/mQ4hMwD.jpeg",
    });

  return embed;
};

export const memberStatsEmbed = (
  title: string,
  description: string,
  member: IMember
) => {
  const { name, discordIdentity, guildName, warnings, isBanned } = member;
  const embed = createEmbedTemplate();
  embed.setTitle(title);
  embed.setDescription(`${description} for Member ${name}`);

  discordIdentity &&
    embed.addFields({ name: "Discord Username", value: discordIdentity });
  guildName && embed.addFields({ name: "In Guild", value: guildName });
  isBanned
    ? embed.addFields({ name: `has ${warnings} warnings`, value: "\u200B" })
    : embed.addFields({
        name: `is banned from your guild(s)`,
        value: "\u200B",
      });

  return embed;
};

export const subguildStatsEmbed = (
  title: string,
  description: string,
  subguild: ISubguild
) => {
  const { guildName } = subguild;
  const embed = createEmbedTemplate();
  embed.setTitle(title);
  embed.setDescription(`${description} for guild ${guildName}`);

  embed.addFields({ name: "Membercount", value: "0" }); // TODO: real membercount

  return embed;
};
