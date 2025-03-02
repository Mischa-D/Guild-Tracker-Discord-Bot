import { IMember } from "./types/IMember.js";
import {
  GuildNotFoundError,
  MemberNotFoundError,
} from "./errors/NotFoundError.js";
import { ISubguild } from "./types/IGuild.js";
import { dbInstance } from "./store/db.js";
import { WithGuildId } from "./types/WithGuildId.js";
import { ObjectId, WithId } from "mongodb";

const db = () => {
  if (!dbInstance) throw Error("no database connection / instance missing");
  return dbInstance;
};

const memberCollection = () => {
  return db().collection<WithGuildId<IMember>>("members");
};

const subguildCollection = () => {
  return db().collection<WithGuildId<ISubguild>>("subguilds");
};

export const getAllMembers = async (guildId: string) => {
  return memberCollection().find({ guildId }).toArray();
};

export const getMember = async (guildId: string, memberId: ObjectId) => {
  const member = await memberCollection().findOne({ guildId, _id: memberId });
  if (!member) throw new MemberNotFoundError();

  return member;
};

export const getAllSubguilds = async (guildId: string) => {
  return subguildCollection().find({ guildId }).toArray();
};

export const getMembersOfSubguild = async (
  guildId: string,
  subguildId: ObjectId
): Promise<{ subguildName: string; members: IMember[] }> => {
  const subguild = await subguildCollection().findOne(
    { _id: subguildId, guildId },
    { projection: { members: 1, guildName: 1, _id: 0 } }
  );

  if (!subguild) throw new GuildNotFoundError();
  if (!subguild.members?.length) {
    return { subguildName: subguild.guildName, members: [] };
  }

  return {
    subguildName: subguild.guildName,
    members: await memberCollection()
      .find({ _id: { $in: subguild.members } })
      .toArray(),
  };
};

export const getSubguild = async (guildId: string, subguildId: ObjectId) => {
  const subguild = await subguildCollection().findOne({
    guildId,
    _id: subguildId,
  });

  if (!subguild) throw new GuildNotFoundError();

  return subguild;
};

export const createMember = async (
  guildId: string,
  member: IMember
): Promise<WithId<IMember>> => {
  const { insertedId } = await db()
    .collection<WithGuildId<IMember>>("members")
    .insertOne({
      ...member,
      guildId,
    });
  console.log("inserted new user", insertedId);

  return {
    ...member,
    _id: insertedId,
  };
};

export const createSubguild = async (
  guildId: string,
  subguild: ISubguild
): Promise<WithId<ISubguild>> => {
  const { insertedId } = await db()
    .collection<WithGuildId<ISubguild>>("subguilds")
    .insertOne({
      ...subguild,
      guildId,
    });
  console.log("created new subguild", insertedId);

  return {
    ...subguild,
    _id: insertedId,
  };
};

export const updateMember = async (
  guildId: string,
  memberId: ObjectId,
  memberUpdate: Partial<IMember>
) => {
  const member = await memberCollection().findOneAndUpdate(
    { guildId, _id: memberId },
    { $set: memberUpdate }
  );

  if (!member) throw new MemberNotFoundError();

  return member;
};

export const updateGuild = async (
  guildId: string,
  subguildId: ObjectId,
  subguildUpdate: Partial<ISubguild>
) => {
  const subguild = await subguildCollection().findOneAndUpdate(
    { guildId, _id: subguildId },
    { $set: subguildUpdate }
  );

  if (!subguild) throw new GuildNotFoundError();

  return subguild;
};

export const moveGuildMember = async (
  guildId: string,
  newSubguildId: ObjectId,
  memberId: ObjectId
) => {
  subguildCollection().updateMany(
    {
      guildId,
      members: { $elemMatch: memberId },
    },
    { $pull: { members: memberId } }
  );
  const newSubguild = await subguildCollection().findOneAndUpdate(
    { guildId, _id: newSubguildId },
    { $addToSet: { members: memberId } }
  );

  if (!newSubguild) throw new GuildNotFoundError();

  return newSubguild;
};

export const moveAllGuildMembersFrom = async (
  guildId: string,
  oldSubguildId: ObjectId,
  newSubguildId: ObjectId
) => {
  console.log("executing move from", oldSubguildId, "to", newSubguildId);
  // get members in source guild
  const { members = [] } =
    (await subguildCollection().findOne({ guildId, _id: oldSubguildId })) ?? {};

  // add members to target guild
  const newSubguild = await subguildCollection().findOneAndUpdate(
    { guildId, _id: newSubguildId },
    { $push: { members: { $each: members } } }
  );

  if (!newSubguild) throw new GuildNotFoundError();

  // delete members from source guild
  subguildCollection().updateOne(
    { guildId, _id: oldSubguildId },
    {
      $set: { members: [] },
    }
  );

  // update guild names of members
  memberCollection().updateMany(
    { guildId, _id: { $in: members } },
    {
      $set: { guildName: newSubguild.guildName },
    }
  );

  return newSubguild;
};

export const getSubguildName = async (
  guildId: string,
  subguildId: ObjectId
) => {
  const subguild = await subguildCollection().findOne(
    { guildId, _id: subguildId },
    { projection: { guildName: 1, _id: 0 } }
  );

  if (!subguild) throw new GuildNotFoundError();

  return subguild.guildName;
};
