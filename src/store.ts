import { Collection } from "discord.js";
import { IMember, ISaveMember } from "./types/IMember.js";
import { v6 as generateUuid } from "uuid";
import { NotFoundError } from "./errors/NotFoundError.js";
import { ISaveSubguild, ISubguild } from "./types/IGuild.js";
import { CustomError } from "./errors/CustomError.js";

const MemberCollectionPerGuild = new Collection<string, IMember[]>();
const SubguildsPerGuild = new Collection<string, ISubguild[]>();

export const getMembersOfGuild = (guildId: string) => {
  return MemberCollectionPerGuild.get(guildId);
};

export const getSubguildsOfGuild = (guildId: string) => {
  return SubguildsPerGuild.get(guildId);
};

export const getMember = (guildId: string, memberId: string) => {
  const member = getMembersOfGuild(guildId)?.find(
    (member) => member.memberid === memberId
  );

  if (!member) throw new NotFoundError("Could not find entry for member");

  return member;
};

export const getSubguild = (guildId: string, subguildId: string) => {
  const subguild = getSubguildsOfGuild(guildId)?.find(
    (subguild) => subguild.guildId === subguildId
  );

  if (!subguild) throw new NotFoundError("Could not find entry for guild");

  return subguild;
};

export const createMember = (guildId: string, member: ISaveMember) => {
  const membersOfGuild = getMembersOfGuild(guildId);
  const memberWithUuid: IMember = {
    ...member,
    memberid: generateUuid(),
  };

  if (!membersOfGuild) {
    console.log("creating new guild member store for guild", guildId);
    MemberCollectionPerGuild.set(guildId, [memberWithUuid]);
  } else {
    membersOfGuild.push(memberWithUuid);
  }

  return memberWithUuid;
};

export const createSubguild = (guildId: string, subguild: ISaveSubguild) => {
  const subguildsOfGuild = getSubguildsOfGuild(guildId);
  const subguildWithUuid: ISubguild = {
    ...subguild,
    guildId: generateUuid(),
  };

  if (!subguildsOfGuild) {
    console.log("creating new subguild store for guild", guildId);
    SubguildsPerGuild.set(guildId, [subguildWithUuid]);
  } else {
    subguildsOfGuild.push(subguildWithUuid);
  }

  return subguildWithUuid;
};

export const updateMember = (
  guildId: string,
  memberId: string,
  memberUpdate: Partial<ISaveMember>
) => {
  const member = getMember(guildId, memberId);

  (Object.keys(member) as (keyof IMember)[]).forEach((key) => {
    if (key === "memberid") return;

    // @ts-ignore
    member[key] = memberUpdate[key] ?? member[key];
  });

  return member;
};

export const updateGuild = (
  guildId: string,
  subguildId: string,
  subguildUpdate: Partial<ISaveSubguild>
) => {
  const subguild = getSubguild(guildId, subguildId);

  (Object.keys(subguild) as (keyof ISubguild)[]).forEach((key) => {
    if (key === "guildId") return;

    // @ts-ignore
    subguild[key] = subguildUpdate[key] ?? subguild[key];
  });

  return subguild;
};

export const moveGuildMember = (
  guildId: string,
  newSubguildId: string,
  memberId: string
) => {
  const subguilds = getSubguildsOfGuild(guildId);
  if (!subguilds) throw new NotFoundError("No guilds found for this server");

  const newSubguild = getSubguild(guildId, newSubguildId);
  if (newSubguild.members.find((id) => id === memberId))
    throw new CustomError("Member is already part of that guild");
  newSubguild.members.push(memberId);

  for (const subguild of subguilds) {
    const index = subguild.members.findIndex((id) => id === memberId);

    if (index === -1) {
      continue;
    }
    delete subguild.members[index];
    break;
  }

  return newSubguild;
};
