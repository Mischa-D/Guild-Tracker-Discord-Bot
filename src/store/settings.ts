import { NotFoundError } from "../errors/NotFoundError.js";
import { ISettings } from "../types/ISettings.js";
import { WithGuildId } from "../types/WithGuildId.js";
import { dbInstance } from "./db.js";

const db = () => {
  if (!dbInstance) throw Error("no database connection / instance missing");
  return dbInstance;
};

const settingsCollection = () => {
  return db().collection<WithGuildId<ISettings>>("settings");
};

export const setWarnThreshold = async (guildId: string, limit: number) => {
  const settings = await settingsCollection().findOneAndUpdate(
    { guildId },
    { $set: { warnLimit: limit } },
    { returnDocument: "after", upsert: true }
  );

  if (!settings)
    throw new NotFoundError("Couldn't retrieve settings for this server");

  return settings;
};

export const getSettings = async (guildId: string) => {
  const settings = await settingsCollection().findOne({ guildId });

  if (!settings)
    throw new NotFoundError("Couldn't retrieve settings for this server");

  return settings;
};
