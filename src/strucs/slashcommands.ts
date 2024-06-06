import {
	ApplicationCommandData,
	AutocompleteInteraction,
	Awaitable,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	MessageContextMenuCommandInteraction,
	UserContextMenuCommandInteraction,
	PermissionResolvable,
} from "discord.js";
import type { ExtendedClient } from "@/strucs/client";
import { resolve } from "node:path";
import { readdirSync } from "node:fs";
import { logger } from "@utils/logger";

interface CommandInteractions {
	[ApplicationCommandType.ChatInput]: ChatInputCommandInteraction;
	[ApplicationCommandType.User]: UserContextMenuCommandInteraction;
	[ApplicationCommandType.Message]: MessageContextMenuCommandInteraction;
}

interface CommandOptions {
	onlyDeveloper?: boolean;
	onlyOwner?: boolean;
	guilds?: string[];
	disabled?: boolean;
	cooldown?: number;
	userPermissions?: PermissionResolvable[];
	botPermissions?: PermissionResolvable[];
}

interface ClientCommand<K extends ApplicationCommandType> {
	data: ApplicationCommandData & { type: K };
	options?: CommandOptions;
	run(
		interaction: CommandInteractions[K],
		client: ExtendedClient,
	): Awaitable<any>;
	autocomplete?(
		interaction: AutocompleteInteraction,
		client: ExtendedClient,
	): Awaitable<any>;
}

export abstract class SlashCommand<K extends ApplicationCommandType>
	implements ClientCommand<K>
{
	public readonly data: ApplicationCommandData & { type: K };
	readonly options?: CommandOptions;

	constructor(command: Omit<ClientCommand<K>, "run" | "autocomplete">) {
		this.data = command.data;
		this.options = command.options;
	}

	public abstract run(
		interaction: CommandInteractions[K],
		client: ExtendedClient,
	): Awaitable<any>;
	public autocomplete?(
		interaction: AutocompleteInteraction,
		client: ExtendedClient,
	): Awaitable<any>;

	private static async loadCommands(client: ExtendedClient): Promise<void> {
		const commandsFolderPath = resolve(__dirname, "../app/commands/slash");

		for (const folder of readdirSync(commandsFolderPath)) {
			const folderPath = resolve(commandsFolderPath, folder);

			for (const file of readdirSync(folderPath)) {
				const filePath = resolve(folderPath, file);
				try {
					const CommandModule = await import(filePath);
					const Command =
						new CommandModule.default() as SlashCommand<ApplicationCommandType>;

					client.slashCommands.set(Command.data.name, Command);
				} catch (error) {
					logger.error(`Failed to load command from file: ${filePath}`, error);
				}
			}
		}
	}

	public static async registerCommands(client: ExtendedClient): Promise<void> {
		await this.loadCommands(client);

		client.on("ready", async () => {
			for (const command of client.slashCommands.values()) {
				if (!command) continue;

				if (command.options?.guilds && command.options?.guilds.length > 0) {
					await this.registerGuildCommands(client, command);
				} else {
					await this.registerGlobalCommand(client, command);
				}
			}
		});
	}

	private static async registerGuildCommands(
		client: ExtendedClient,
		command: SlashCommand<ApplicationCommandType>,
	): Promise<void> {
		for (const guild of command.options?.guilds || []) {
			try {
				await client.application?.commands.set(command.data as never, guild);
				logger.success(
					`Registered SlashCommand: ${command.data.name} in guild: ${guild} successfully.`,
				);
			} catch (error) {
				logger.error(
					`Failed to register SlashCommand: ${command.data.name} in guild: ${guild}`,
					error,
				);
			}
		}
	}

	private static async registerGlobalCommand(
		client: ExtendedClient,
		command: SlashCommand<ApplicationCommandType>,
	): Promise<void> {
		try {
			const cmd = await client.application?.commands.create(command.data);
			if (cmd) {
				logger.success(
					`Registered SlashCommand: ${command.data.name} successfully.`,
				);
			}
		} catch (error) {
			logger.error(
				`Failed to register SlashCommand: ${command.data.name}`,
				error,
			);
		}
	}
}
