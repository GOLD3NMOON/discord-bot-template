import { PrefixCommands } from "@/strucs/PrefixCommands";
import { formatter } from "@/utils/formatter";
import { Message, codeBlock } from "discord.js";

export default class Ping extends PrefixCommands {
	constructor() {
		super({
			name: "ping",
			aliases: ["pong"],
		});
	}
	public run(message: Message<boolean>): void {
		message.reply(
			formatter.customEmbed.success(
				`${formatter.icon("green_bag")} Hello ${
					message.author.username
				}! my ping is ${codeBlock(message.client.ws.ping.toString() + "ms")}`,
			),
		);
	}
}
