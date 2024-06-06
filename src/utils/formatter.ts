import settings from "@settings/app.json";
import { formatEmoji, ColorResolvable, EmbedBuilder } from "discord.js";

type TEmojisList = typeof settings.ui.emojis;
type TEmojiKeys =
	| keyof TEmojisList["static"]
	| `:a:${keyof TEmojisList["animated"]}`;
type TSettingsColors = typeof settings.ui.colors;
type TInteractionResponse = {
	[K in keyof TSettingsColors]: <O>(text: string, options?: O) => O;
};

class Formatter {
	public timeToMilliseconds(time: string): number {
		const [minutes, seconds] = time.split(":").map(Number);
		return (minutes * 60 + seconds) * 1000;
	}

	public limitCharacters(text: string, length: number): string {
		return text.length > length ? `${text.substring(0, length)}...` : text;
	}

	public icon(icon: TEmojiKeys) {
		const animated = icon.startsWith(":a:");
		const key = animated ? icon.slice(3) : icon;
		const id = animated
			? settings.ui.emojis.animated[key as keyof TEmojisList["animated"]]
			: settings.ui.emojis.static[key as keyof TEmojisList["static"]];

		const toString = () => formatEmoji(id, animated);
		return { id, icon, toString };
	}

	public customEmbed: TInteractionResponse = Object.entries(
		settings.ui.colors,
	).reduce((obj, [name, color]) => {
		obj[name as keyof TSettingsColors] = <O>(
			text: string,
			options: O = {} as O,
		) => {
			const embed = new EmbedBuilder({ description: text }).setColor(
				color as ColorResolvable,
			);
			(options as any).embeds = [embed, ...((options as any).embeds || [])];
			return options;
		};
		return obj;
	}, {} as TInteractionResponse);
}

export const formatter = new Formatter();
