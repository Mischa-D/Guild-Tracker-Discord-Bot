import { Db, MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
export let dbInstance: Db | null;

export async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    dbInstance = client.db("guild_tracker");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

export const closeDB = () => {
  client.close();
};
