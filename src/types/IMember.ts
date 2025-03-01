import { UserMention } from "discord.js";

export interface IMember {
  name: string;
  warnings: number;
  isBanned: boolean;
  isActive: boolean;
  discordIdentity?: UserMention;
  guildName?: string;
}


export type IUpdateMember = Partial<IMember>;
