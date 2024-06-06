import { Event } from "@/strucs/events";
import { logger } from "@utils/logger";
import { Awaitable, Message } from "discord.js";

export default class Ready extends Event<"messageCreate"> {
	constructor() {
		super("messageCreate", {
			once: true,
		});
	}
	public run(message: Message<boolean>): Awaitable<void> {
		logger.success(`Ready! Logged in as ${message.client.user?.tag}!`);
	}
}
