import { ObjectId } from "mongodb";
import { IMember } from "./IMember.js";

export interface ISubguild {
  guildName: string;
  isActive: boolean;
  members: ObjectId[];
}

export type IUpdateSubguild = Omit<ISubguild, "members">;

export interface ISubguildFull {
  guildName: string;
  isActive: boolean;
  members: IMember[];
}
