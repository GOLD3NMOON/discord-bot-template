import { ExtendedClient } from "@strucs/client";
import { SlashCommand } from "@strucs/slashcommands";
import {
	ApplicationCommandType,
	CacheType,
	ChatInputCommandInteraction,
	codeBlock,
} from "discord.js";
import { formatter } from "@/utils/formatter";

export default class Ping extends SlashCommand<ApplicationCommandType.ChatInput> {
	constructor() {
		super({
			data: {
				name: "ping",
				description: "View ping from this bot.",
				type: ApplicationCommandType.ChatInput,
			},
			options: {
				cooldown: 5,
				botPermissions: ["SendMessages"],
			},
		});
	}
	public run(
		interaction: ChatInputCommandInteraction<CacheType>,
		client: ExtendedClient,
	) {
		return interaction.reply(
			formatter.customEmbed.success(
				`Hello ${interaction.user.username}! my ping is ${codeBlock(
					client.ws.ping.toString() + "ms",
				)}`,
			),
		);
	}
}
