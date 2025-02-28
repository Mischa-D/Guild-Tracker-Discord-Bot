import { UserMention } from "discord.js";

export interface IMember {
  memberid: string;
  name: string;
  warnings: number;
  isBanned: boolean;
  isInGuild: boolean;
  discordIdentity?: UserMention;
  guildName?: string;
}

export type ISaveMember = Omit<IMember, "memberid">;

export type IUpdateMember = Partial<ISaveMember>;
