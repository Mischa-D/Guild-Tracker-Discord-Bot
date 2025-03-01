import { ObjectId } from "mongodb";

export interface ISubguild {
  guildName: string;
  isActive: boolean;
  members: ObjectId[];
}

export type IUpdateSubguild = Omit<ISubguild, "members">;
