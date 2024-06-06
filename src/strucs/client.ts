import { logger } from "@/utils/logger";
import {
	ApplicationCommandType,
	Client,
	Collection,
	GatewayIntentBits,
	Partials,
} from "discord.js";
import { config } from "@settings/env";
import { ActionRowType, Components } from "@strucs/components";
import { PrefixCommands } from "@strucs/prefixcommands";
import { SlashCommand } from "@strucs/slashcommands";
import { Event } from "@strucs/events";

export class ExtendedClient extends Client {
	readonly onlyUsers = new Collection<string, string>();
	readonly prefixCommands = new Collection<string, PrefixCommands>();
	readonly aliases = new Collection<string, PrefixCommands>();
	readonly slashCommands = new Collection<
		string,
		SlashCommand<ApplicationCommandType>
	>();
	readonly components = new Collection<string, Components<ActionRowType>>();
	readonly cooldowns = new Collection<string, Date>();

	constructor() {
		super({
			intents: Object.values(GatewayIntentBits) as number[],
			partials: [
				Partials.User,
				Partials.GuildMember,
				Partials.GuildScheduledEvent,
				Partials.Message,
				Partials.Reaction,
				Partials.ThreadMember,
			],
		});
	}

	public connect(): void {
		try {
			this.initialize();
			this.login(config.APP_TOKEN);
		} catch (error) {
			logger.error("Error while connecting to API: ", error);
		}
	}

	private initialize(): void {
		try {
			this.loadPrefixCommands();
			this.loadEventListeners();
			this.registerSlashCommands();
			this.setupErrorHandling();
			this.registerComponents();
		} catch (error) {
			logger.error("Error while initializing client: ", error);
		}
	}

	private loadPrefixCommands(): void {
		PrefixCommands.load(this);
	}

	private loadEventListeners(): void {
		Event.load(this);
	}

	private registerSlashCommands(): void {
		SlashCommand.registerCommands(this);
	}

	private registerComponents(): void {
		Components.registerComponents(this);
	}

	private setupErrorHandling(): void {
		process.on("uncaughtException", (error: Error) => {
			logger.error(
				`Uncaught exception error: ${error.name} - ${error.message}`,
			);
		});

		this.on("error", (error: Error) => {
			logger.error(`Client error: ${error.name} - ${error.message}`);
		});
	}
}
