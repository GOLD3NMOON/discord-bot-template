import { Event } from "@/strucs/events";
import { Message, codeBlock } from "discord.js";
import { ExtendedClient } from "@/strucs/client";
import settings from "@/settings/app.json";
import { formatter } from "@/utils/formatter";
import { logger } from "@/utils/logger";

export default class MessageCreate extends Event<"messageCreate"> {
	constructor() {
		super("messageCreate", {
			once: false,
		});
	}

	public async run(message: Message<boolean>): Promise<void> {
		const client: ExtendedClient = message.client as ExtendedClient;

		if (message.author.bot || !message.content.startsWith(settings.prefix))
			return;

		const args = message.content
			.slice(settings.prefix.length)
			.trim()
			.split(/ +/);
		const commandName = args.shift()?.toLowerCase();

		if (!commandName) return;

		const command = client.prefixCommands.get(commandName);

		if (command) {
			try {
				if (command.cooldown) {
					const cooldownAmount = (command.cooldown || 0) * 1000;

					if (!client.cooldowns.has(message.author.id)) {
						client.cooldowns.set(message.author.id, new Date(0));
					}

					const now = new Date();
					const userCooldown = client.cooldowns.get(message.author.id)!;
					const expirationTime = userCooldown.getTime() + cooldownAmount;

					if (now.getTime() < expirationTime) {
						const timeLeft = (expirationTime - now.getTime()) / 1000;
						await message.reply(
							formatter.customEmbed.warning(
								`Please wait ${timeLeft.toFixed(
									1,
								)} more second(s) before reusing the \`${commandName}\` command.`,
							),
						);
						return;
					}

					client.cooldowns.set(message.author.id, now);
					setTimeout(() => {
						if (client.cooldowns.has(message.author.id)) {
							client.cooldowns.delete(message.author.id);
						}
					}, cooldownAmount);
				}

				if (
					command.onlyOwner &&
					!settings.developers.includes(message.author.id)
				) {
					return;
				}

				if (
					command.onlyDeveloper &&
					!settings.developers.includes(message.author.id)
				) {
					return;
				}

				if (command.guilds) {
					if (!command.guilds.includes(message.guild?.id as string)) {
						return;
					}
				}

				if (command.disabled) {
					await message.reply(
						formatter.customEmbed.warning("This command is disabled."),
					);
					return;
				}

				if (command.userPermissions) {
					if (
						!message.member?.permissions.has(
							command.userPermissions.map((p) => p),
						)
					) {
						await message.reply(
							formatter.customEmbed.error(
								`You do not have the required permissions to use this command you need: ${codeBlock(
									command.userPermissions.map((p) => ` ${p}`).join(","),
								)}`,
							),
						);
						return;
					}
				}

				if (command.botPermissions) {
					if (
						!message.guild?.members.me?.permissions.has(
							command.botPermissions.map((p) => p),
						)
					) {
						await message.reply(
							formatter.customEmbed.error(
								`I do not have the required permissions to use this command you need: ${codeBlock(
									command.botPermissions.map((p) => ` ${p}`).join(","),
								)}`,
							),
						);
						return;
					}
				}

				await command.run(message, ...args);
			} catch (error) {
				logger.error(`Error executing command: ${commandName} - ${error}`);
				await message.reply("There was an error executing that command.");
			}
		} else {
			logger.error(`Invalid command: ${commandName}`);
			await message.reply("Invalid command!");
		}
	}
}
