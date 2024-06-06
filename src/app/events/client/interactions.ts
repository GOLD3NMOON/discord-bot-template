import { ExtendedClient } from "@/strucs/client";
import { logger } from "@/utils/logger";
import { CacheType, Interaction, codeBlock } from "discord.js";
import { Event } from "@/strucs/events";
import settings from "@settings/app.json";
import { formatter } from "@/utils/formatter";

export default class Interactions extends Event<"interactionCreate"> {
	constructor() {
		super("interactionCreate", {
			once: false,
		});
	}
	public async run(interaction: Interaction<CacheType>): Promise<void> {
		const client: ExtendedClient = interaction.client as ExtendedClient;

		if (interaction.isChatInputCommand()) {
			const command = client.slashCommands.get(interaction.commandName);

			if (!command) return;

			try {
				if (
					command.options?.onlyOwner &&
					!settings.developers.includes(interaction.user.id)
				) {
					return;
				}

				if (command.options?.disabled) {
					if (interaction.deferred) {
						await interaction.editReply(
							formatter.customEmbed.warning(
								"You cannot use this command is disabled.",
							),
						);
					} else {
						await interaction.reply(
							formatter.customEmbed.warning(
								"You cannot use this command is disabled.",
								{ ephemeral: true },
							),
						);
					}
					return;
				}

				if (
					command.options?.onlyDeveloper &&
					!settings.developers.includes(interaction.user.id)
				) {
					return;
				}

				if (command.options?.cooldown) {
					const now = new Date();
					const timestamps =
						client.cooldowns.get(interaction.user.id) || new Date(0);
					const difference = now.getTime() - timestamps.getTime();

					if (difference < command.options.cooldown * 1000) {
						const timeLeft = command.options.cooldown * 1000 - difference;
						if (interaction.deferred) {
							await interaction.editReply(
								formatter.customEmbed.warning(
									`Please wait ${
										timeLeft / 1000
									} seconds before using this command again.`,
								),
							);
						} else {
							await interaction.reply(
								formatter.customEmbed.warning(
									`Please wait ${
										timeLeft / 1000
									} seconds before using this command again.`,
									{ ephemeral: true },
								),
							);
						}
						return;
					}

					if (command.options?.userPermissions) {
						if (
							!interaction.memberPermissions?.has(
								command.options.userPermissions.map((p) => p),
							)
						) {
							if (interaction.deferred) {
								await interaction.editReply(
									formatter.customEmbed.warning(
										`You do not have the required permissions to use this command you need: ${codeBlock(
											command.options.userPermissions
												.map((p) => ` ${p}`)
												.join(","),
										)}`,
									),
								);
							} else {
								await interaction.reply(
									formatter.customEmbed.warning(
										`You do not have the required permissions to use this command you need: ${codeBlock(
											command.options.userPermissions
												.map((p) => ` ${p}`)
												.join(","),
										)}`,
										{ ephemeral: true },
									),
								);
							}
							return;
						}
					}

					if (command.options?.botPermissions) {
						if (
							!interaction.guild?.members.me?.permissions.has(
								command.options.botPermissions.map((p) => p),
							)
						) {
							if (interaction.deferred) {
								await interaction.editReply(
									formatter.customEmbed.warning(
										`I don't have the necessary permissions to use this command. need: ${codeBlock(
											command.options?.botPermissions
												.map((p) => ` ${p}`)
												.join(","),
										)}`,
									),
								);
							} else {
								await interaction.reply(
									formatter.customEmbed.warning(
										`I don't have the necessary permissions to use this command. need: ${codeBlock(
											command.options?.botPermissions
												.map((p) => ` ${p}`)
												.join(","),
										)}`,
										{ ephemeral: true },
									),
								);
							}
							return;
						}
					}

					client.cooldowns.set(interaction.user.id, now);
				}

				await command.run(interaction, client);
			} catch (error) {
				logger.error(`Error handling interaction: ${error}`);
				await interaction.reply(
					formatter.customEmbed.warning(
						"An error occurred while executing this command.",
						{ ephemeral: true },
					),
				);
			}
		}

		if (interaction.isButton()) {
			const button = client.components.get(interaction.customId);
			try {
				if (button) {
					if (button.options?.disabled) {
						if (interaction.deferred) {
							await interaction.editReply(
								formatter.customEmbed.warning("This button is disabled."),
							);
						} else {
							await interaction.reply(
								formatter.customEmbed.warning("This button is disabled.", {
									ephemeral: true,
								}),
							);
						}
						return;
					}

					if (
						button.options?.onlyDeveloper &&
						!settings.developers.includes(interaction.user.id)
					) {
						return;
					}

					if (
						button.options?.onlyOwner &&
						!settings.developers.includes(interaction.user.id)
					) {
						return;
					}

					if (button.options?.onlyUser) {
						if (
							interaction.user.id !==
							client.onlyUsers.get(interaction.user.id as string)
						) {
							if (interaction.deferred) {
								await interaction.editReply(
									formatter.customEmbed.warning(
										"Only a user that has used the play command can use this button.",
									),
								);
							} else {
								await interaction.reply(
									formatter.customEmbed.warning(
										"Only a user that has used the play command can use this button..",
										{ ephemeral: true },
									),
								);
							}
							return;
						}
					}

					await button.run(interaction, client);
				}
			} catch (error) {
				logger.error(`Error handling interaction - ${error}`);
			}
		}

		if (interaction.isStringSelectMenu()) {
			const selectMenu = client.components.get(interaction.customId);

			try {
				if (selectMenu) {
					if (selectMenu.options?.disabled) {
						if (interaction.deferred) {
							await interaction.editReply(
								formatter.customEmbed.warning("This select menu is disabled."),
							);
						} else {
							await interaction.reply(
								formatter.customEmbed.warning("This select menu is disabled.", {
									ephemeral: true,
								}),
							);
						}
						return;
					}

					if (
						selectMenu.options?.onlyDeveloper &&
						!settings.developers.includes(interaction.user.id)
					) {
						return;
					}

					if (
						selectMenu.options?.onlyOwner &&
						!settings.developers.includes(interaction.user.id)
					) {
						return;
					}

					await selectMenu.run(interaction, client);
				}
			} catch (error) {
				logger.error(`Error handling interaction - ${error}`);
			}
		}

		if (interaction.isChannelSelectMenu()) {
			const selectMenu = client.components.get(interaction.customId);

			try {
				if (selectMenu) {
					if (selectMenu.options?.disabled) {
						if (interaction.deferred) {
							await interaction.editReply(
								formatter.customEmbed.warning("This select menu is disabled."),
							);
						} else {
							await interaction.reply(
								formatter.customEmbed.warning("This select menu is disabled.", {
									ephemeral: true,
								}),
							);
						}
						return;
					}

					if (
						selectMenu.options?.onlyDeveloper &&
						!settings.developers.includes(interaction.user.id)
					) {
						return;
					}

					if (
						selectMenu.options?.onlyOwner &&
						!settings.developers.includes(interaction.user.id)
					) {
						return;
					}
				}
			} catch (error) {
				logger.error(`Error handling interaction - ${error}`);
			}
		}

		if (interaction.isStringSelectMenu()) {
			const selectMenu = client.components.get(interaction.customId);

			try {
				if (selectMenu) {
					if (selectMenu.options?.disabled) {
						if (interaction.deferred) {
							await interaction.editReply(
								formatter.customEmbed.warning("This select menu is disabled."),
							);
						} else {
							await interaction.reply(
								formatter.customEmbed.warning("This select menu is disabled.", {
									ephemeral: true,
								}),
							);
						}
						return;
					}

					if (
						selectMenu.options?.onlyDeveloper &&
						!settings.developers.includes(interaction.user.id)
					) {
						return;
					}

					if (
						selectMenu.options?.onlyOwner &&
						!settings.developers.includes(interaction.user.id)
					) {
						return;
					}

					await selectMenu.run(interaction, client);
				}
			} catch (error) {
				logger.error(`Error handling interaction - ${error}`);
			}
		}

		if (interaction.isModalSubmit()) {
			const modal = client.components.get(interaction.customId);

			try {
				if (modal) {
					if (modal.options?.disabled) {
						if (interaction.deferred) {
							await interaction.editReply(
								formatter.customEmbed.warning("This modal is disabled."),
							);
						} else {
							await interaction.reply(
								formatter.customEmbed.warning("This modal is disabled.", {
									ephemeral: true,
								}),
							);
						}
						return;
					}

					if (
						modal.options?.onlyDeveloper &&
						!settings.developers.includes(interaction.user.id)
					) {
						return;
					}

					if (
						modal.options?.onlyOwner &&
						!settings.developers.includes(interaction.user.id)
					) {
						return;
					}

					await modal.run(interaction, client);
				}
			} catch (error) {
				logger.error(`Error handling interaction - ${error}`);
			}
		}
	}
}
