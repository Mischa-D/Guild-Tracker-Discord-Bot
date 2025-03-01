import { Collection } from "discord.js";
import { IMember, ISaveMember } from "./types/IMember.js";
import { v6 as generateUuid } from "uuid";
import { NotFoundError } from "./errors/NotFoundError.js";

export const MemberCollectionPerGuild = new Collection<string, IMember[]>();

export const getMembersOfGuild = (guildId: string) => {
  return MemberCollectionPerGuild.get(guildId);
};

export const getMember = (guildId: string, memberId: string) => {
  const member = getMembersOfGuild(guildId)?.find(
    (member) => member.memberid === memberId
  );

  if (!member) throw new NotFoundError("Could not find entry for that member");

  return member;
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
