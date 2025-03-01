export interface ISubguild {
  guildId: string;
  guildName: string;
  isActive: boolean;
}

export type ISaveSubguild = Omit<ISubguild, "guildId">;
