import {
  AutocompleteInteraction,
  Client,
  Collection,
} from "discord.js";
import { getFiles } from "./get-command-files.js";
import { ICommand } from "../types/ICommand.js";
import { replyEphemeral } from "./reply.js";
import { CustomError } from "../errors/CustomError.js";
import { COMMANDS_FOLDER } from "../constants.js";
import { WithGuildId } from "../types/WithGuildId.js";

export const autocompleteInteractionCollection = new Collection<
  string,
  AutocompleteInteraction | null
>();

const hasGuildId = <T extends object>(
  interaction: T
): interaction is WithGuildId<T> => {
  if (!("guildId" in interaction) || !interaction.guildId)
    throw new CustomError("Could not associate request with a Discord server");
  return true;
};

export const handler = (client: Client) => {
  const commands = new Collection<string, ICommand>();

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
    if (!hasGuildId(interaction)) return;

    const command = commands.get(interaction.commandName);

    if (interaction.isAutocomplete()) {
      autocompleteInteractionCollection.set(interaction.guildId, interaction);
      await command?.autocomplete?.(interaction);
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
        try {
          await replyEphemeral(interaction, error.message);
        } catch (error) {
          console.error("sending error message failed with error", error);
        }
        return;
      }
      await replyEphemeral(interaction, "Uh Oh! Something went wrong.");
    }
  });
};
