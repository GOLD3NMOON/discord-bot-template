import { ExtendedClient } from "@/strucs/client";
import { Message, PermissionResolvable } from "discord.js";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { logger } from "@utils/logger";

interface IPrefixCommand {
	name: string;
	aliases: string[];
	onlyDeveloper?: boolean;
	onlyOwner?: boolean;
	guilds?: string[];
	disabled?: boolean;
	cooldown?: number;
	userPermissions?: PermissionResolvable[];
	botPermissions?: PermissionResolvable[];
}

export abstract class PrefixCommands {
	readonly name: string;
	readonly aliases: string[];
	readonly userPermissions?: PermissionResolvable[];
	readonly botPermissions?: PermissionResolvable[];
	readonly cooldown?: number;
	readonly onlyDeveloper?: boolean;
	readonly onlyOwner?: boolean;
	readonly guilds?: string[];
	readonly disabled?: boolean;

	public constructor(options: IPrefixCommand) {
		Object.assign(this, options);
		this.name = options.name;
		this.aliases = options.aliases;
	}

	public abstract run(message: Message, ...args: string[]): void;

	public static async load(client: ExtendedClient): Promise<void> {
		const commandsFolderPath = resolve(__dirname, "../app/commands/prefix");

		for (const folder of readdirSync(commandsFolderPath)) {
			const folderPath = resolve(commandsFolderPath, folder);

			for (const file of readdirSync(folderPath)) {
				const filePath = resolve(folderPath, file);
				try {
					const CommandModule = await import(filePath);
					const Command = new CommandModule.default() as PrefixCommands;

					client.prefixCommands.set(Command.name, Command);
					Command.aliases.forEach((alias) =>
						client.prefixCommands.set(alias, Command),
					);

					logger.success(
						`Loaded command: ${
							Command.name
						} with aliases: ${Command.aliases.join(", ")}`,
					);
				} catch (error) {
					logger.error(`Failed to load command from file: ${filePath}`, error);
				}
			}
		}
	}

	public static get(
		name: string,
		client: ExtendedClient,
	): PrefixCommands | undefined {
		return client.prefixCommands.get(name);
	}
}
