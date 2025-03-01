export interface ISubguild {
  guildId: string;
  guildName: string;
  isActive: boolean;
  members: string[];
}

export type ISaveSubguild = Omit<ISubguild, "guildId">;

export type IUpdateSubguild = Omit<ISaveSubguild, "members">;
