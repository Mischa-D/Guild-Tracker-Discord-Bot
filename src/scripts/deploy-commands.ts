import { REST } from "discord.js";
import { Routes } from "discord-api-types/rest/v10";
import { getFiles } from "../utils/get-command-files.js";
import dotenv from "dotenv";
import { ICommand } from "../types/ICommand.js";
import { COMMANDS_FOLDER } from "../constants.js";
dotenv.config();

if (!process.env.TOKEN) throw Error("Token env variable missing");

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

Promise.all(
  getFiles(COMMANDS_FOLDER).map(async (file) => {
    const { default: command }: { default: ICommand } = await import(file);
    console.log(command);
    return command.data.toJSON();
  })
)
  .then((commands) => {
    if (!process.env.CLIENT_ID) throw Error("Client ID missing");
    rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
  })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
