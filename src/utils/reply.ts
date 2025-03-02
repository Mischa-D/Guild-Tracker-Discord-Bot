import { ChatInputCommandInteraction } from "discord.js";

export const replyEphemeral = async (
  interaction: ChatInputCommandInteraction,
  message: string
) => {
  return await interaction.reply({
    content: message,
    ephemeral: true,
  });
};
