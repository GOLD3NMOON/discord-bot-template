import colors from "@settings/app.json";

function convertHexToConsoleColor(hex: string): string {
	if (!hex) return "";
	const [r, g, b] = hex.match(/[A-Za-z0-9]{2}/g)!.map((c) => parseInt(c, 16));
	return `\x1b[38;2;${r};${g};${b}m`;
}

type TSettingsColors = {
	[key in keyof typeof colors.ui.colors]: (
		message: string,
		...args: any[]
	) => void;
};

const logger: TSettingsColors = Object.entries(colors.ui.colors).reduce(
	(obj, [type, color]) => ({
		...obj,
		[type]: (message: string, ...args: any[]) =>
			console.log(
				`${convertHexToConsoleColor(
					color,
				)}[${type.toUpperCase()}]\x1b[0m ${message}`,
				...args,
			),
	}),
	{} as TSettingsColors,
);

export { logger };
