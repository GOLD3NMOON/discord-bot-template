import { PrefixCommands } from "@/strucs/prefixcommands";
import { formatter } from "@/utils/formatter";
import { Message, codeBlock } from "discord.js";

export default class Ping extends PrefixCommands {
	constructor() {
		super({
			name: "ping",
			aliases: ["pong"],
			cooldown: 5,
			userPermissions: ["SendMessages", "ViewChannel"],
		});
	}
	public run(message: Message<boolean>): void {
		message.reply(
			formatter.customEmbed.success(
				`Hello ${message.author.username}! my ping is ${codeBlock(
					message.client.ws.ping.toString() + "ms",
				)}`,
			),
		);
	}
}
