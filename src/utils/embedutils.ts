import { EmbedBuilder } from "discord.js";
import { IMember } from "../types/IMember.js";
import { ISubguild } from "../types/IGuild.js";
import { DEFAULT_WARN_THRESHOLD } from "../constants.js";
import { ISettings } from "../types/ISettings.js";

const MEMBERS_PER_PAGE = 100;

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

export const settingsEmbed = async (
  title: string,
  description: string,
  settings: ISettings
) => {
  const { warnLimit } = settings;
  const embed = await createEmbedTemplate();
  embed.setTitle(title);
  embed.setDescription(description);

  embed.addFields({
    name: `max Number of Warnings: ${warnLimit}`,
    value: "\u200B",
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

  embed.addFields({ name: "Membercount", value: `${subguild.members.length}` });

  return embed;
};

export const membersListEmbed = async (
  title: string,
  members: IMember[],
  warnLimit?: number
) => {
  const embed = await createEmbedTemplate();
  embed.setTitle(title);
  embed.setDescription(`Viewing members of guild`);
  if (!members.length)
    return embed.setFields({
      name: "This guild has no members",
      value: "\u200B",
    });

  const memberRows = members
    .slice()
    .sort((a, b) => b.warnings - a.warnings)
    .map((member) => memberToRow(member, warnLimit));

  const numPages = Math.ceil(memberRows.length / MEMBERS_PER_PAGE);
  const pages: string[][] = [];
  for (let page = 0; page < numPages; page++) {
    pages.push(
      memberRows.slice(page * MEMBERS_PER_PAGE, (page + 1) * MEMBERS_PER_PAGE)
    );
  }

  embed.addFields({
    name: `${pages[0].length}/${memberRows.length}`,
    value: memberRows.join("\n"),
  });

  return embed;
};

const memberToRow = (member: IMember, warnLimit?: number) => {
  return `${warningBar(member.warnings, warnLimit)}${t()}${member.name} ${
    member.discordIdentity ? `(${member.discordIdentity})` : ""
  }`;
};

const warningBar = (warnings: number, warnLimit?: number) => {
  return `${":x:".repeat(warnings)}${":heavy_multiplication_x:".repeat(
    (warnLimit ?? DEFAULT_WARN_THRESHOLD) - warnings
  )}`;
};

const t = () => {
  return "    ";
};
