import { IMember } from "../types/IMember.js";
import {
  GuildNotFoundError,
  MemberNotFoundError,
} from "../errors/NotFoundError.js";
import { ISubguild, ISubguildFull } from "../types/IGuild.js";
import { dbInstance } from "./db.js";
import { WithGuildId } from "../types/WithGuildId.js";
import { ObjectId, WithId } from "mongodb";
import { WARN_THRESHOLD } from "../constants.js";
import { UserMention } from "discord.js";

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

export const getSubguild = async (
  guildId: string,
  subguildId: ObjectId
): Promise<ISubguildFull> => {
  const subguild = await subguildCollection()
    .aggregate<ISubguildFull>([
      {
        $match: {
          _id: subguildId,
          guildId,
        },
      },
      {
        $lookup: {
          from: "members",
          foreignField: "_id",
          localField: "members",
          as: "members",
        },
      },
    ])
    .next();

  if (!subguild) throw new GuildNotFoundError();
  return subguild;
};

export const createMember = async (
  guildId: string,
  name: string,
  discordIdentity?: UserMention,
  subguildId?: ObjectId
): Promise<IMember> => {
  const { guildName } =
    (await subguildCollection().findOne({
      guildId,
      _id: subguildId,
    })) ?? {};

  const member = {
    name,
    warnings: 0,
    isActive: true,
    isBanned: false,
    discordIdentity,
    guildName,
    guildId,
  };

  const { insertedId } = await memberCollection().insertOne(member);
  console.log("inserted new user", insertedId);

  if (subguildId) {
    subguildCollection().findOneAndUpdate(
      {
        guildId,
        _id: subguildId,
      },
      { $addToSet: { members: insertedId } },
      { returnDocument: "after" }
    );
    console.log("added user to guild", subguildId);
  }

  return member;
};

export const createSubguild = async (
  guildId: string,
  subguild: ISubguild
): Promise<ISubguild> => {
  const { insertedId } = await subguildCollection().insertOne({
    ...subguild,
    guildId,
  });
  console.log("created new subguild", insertedId);

  return subguild;
};

export const updateMember = async (
  guildId: string,
  memberId: ObjectId,
  memberUpdate: Partial<IMember>
) => {
  const member = await memberCollection().findOneAndUpdate(
    { guildId, _id: memberId },
    { $set: memberUpdate },
    { returnDocument: "after" }
  );

  if (!member) throw new MemberNotFoundError();

  return member;
};

export const modifyWarnings = async (
  guildId: string,
  memberId: ObjectId,
  modifyAmount: number
) => {
  const member = await memberCollection().findOneAndUpdate(
    { guildId, _id: memberId },
    {
      $inc: { warnings: modifyAmount },
      $min: { warnings: 0 },
      $max: { warnings: WARN_THRESHOLD },
    },
    { returnDocument: "after" }
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
    { $set: subguildUpdate },
    { returnDocument: "after" }
  );

  if (!subguild) throw new GuildNotFoundError();

  return subguild;
};

const moveMemberFrom = async (guildId: string, memberId: ObjectId) => {
  subguildCollection().updateMany(
    {
      guildId,
      members: memberId,
    },
    { $pull: { members: memberId } }
  );
};

export const removeFromAllGuilds = async (
  guildId: string,
  memberId: ObjectId
) => moveMemberFrom(guildId, memberId);

export const moveGuildMember = async (
  guildId: string,
  memberId: ObjectId,
  newSubguildId: ObjectId
) => {
  moveMemberFrom(guildId, memberId);

  const newSubguild = await subguildCollection().findOneAndUpdate(
    { guildId, _id: newSubguildId },
    { $addToSet: { members: memberId } },
    { returnDocument: "after" }
  );

  if (!newSubguild) throw new GuildNotFoundError();

  const member = await updateMember(guildId, memberId, {
    guildName: newSubguild.guildName,
  });

  return member;
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
    { $push: { members: { $each: members } } },
    { returnDocument: "after" }
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
