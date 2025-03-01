import { CacheType, Client, Collection, Interaction } from "discord.js";
import { getFiles } from "./get-command-files.js";
import { ICommand } from "../types/ICommand.js";
import { replyEphemeral } from "./reply.js";
import { CustomError } from "../errors/CustomError.js";
import { COMMANDS_FOLDER } from "../constants.js";

export const handler = (client: Client) => {
  const commands = new Collection<string, ICommand>();
  let latestInteraction: Interaction<CacheType>;

  const commandFiles = getFiles(COMMANDS_FOLDER);
  console.log(commandFiles);

  commandFiles.forEach(async (commandFileName) => {
    const { default: command }: { default: ICommand } = await import(
      commandFileName
    );
    commands.set(command.data.name, command);
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isAutocomplete())
      return;

    latestInteraction = interaction;
    const command = commands.get(interaction.commandName);

    if (interaction.isAutocomplete()) {
      await command?.autocomplete?.(interaction, latestInteraction);
      return;
    }

    if (!command) {
      await replyEphemeral(interaction, "Could not find the requested command");
      return;
    }

    try {
      console.log(
        `User ${interaction.user.tag} used command ${interaction.commandName}`
      );
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        await replyEphemeral(interaction, error.message);
        return;
      }
      await replyEphemeral(interaction, "Uh Oh! Something went wrong.");
    }
  });
};
