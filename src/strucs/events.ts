import { ClientEvents, Awaitable } from "discord.js";
import { ExtendedClient } from "@/strucs/client";
import { readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { logger } from "@utils/logger";

type IEventOptions = {
	once?: boolean;
};

export abstract class Event<T extends keyof ClientEvents> {
	constructor(
		public readonly name: T,
		public readonly options: IEventOptions = {},
	) {}

	public abstract run(...args: ClientEvents[T]): Awaitable<void>;

	public static async load<T extends keyof ClientEvents>(
		client: ExtendedClient,
	) {
		const eventsFolderPath = resolve(__dirname, "../app/events");

		for (const folder of readdirSync(eventsFolderPath)) {
			const folderPath = join(eventsFolderPath, folder);

			for (const file of readdirSync(folderPath)) {
				const Event = new (
					await import(resolve(folderPath, file))
				).default() as Event<T>;

				try {
					if (Event.options.once) {
						client.once(Event.name, (...args) => Event.run(...args));
					} else {
						client.on(Event.name, (...args) => Event.run(...args));
					}
					logger.success(`Loaded event: ${Event.name}`);
				} catch (error) {
					logger.error(`Failed to load event: ${Event.name}`, error);
				}
			}
		}
	}
}
