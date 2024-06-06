import type { Awaitable, Collection, PermissionResolvable } from "discord.js";
import { ExtendedClient } from "./client";
import type {
	AnySelectMenuInteraction,
	ButtonInteraction,
	ModalSubmitInteraction,
} from "discord.js";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

export enum ActionRowType {
	Button = 1,
	Modal = 2,
	SelectMenu = 3,
}

interface BaseOptions {
	onlyDeveloper?: boolean;
	onlyOwner?: boolean;
	disabled?: boolean;
	guilds?: string[];
	userPermissions?: PermissionResolvable[];
	botPermissions?: PermissionResolvable[];
	onlyUser?: boolean;
}

interface ComponentInteractions {
	1: ButtonInteraction;
	2: ModalSubmitInteraction;
	3: AnySelectMenuInteraction;
}

interface ClientComponent<K extends ActionRowType> {
	customId: string;
	type: K;
	options?: ComponentOptions<K>;
}

type ComponentOptions<K extends ActionRowType> =
	K extends ActionRowType.SelectMenu
		? BaseOptions & { multiple?: boolean; value?: string }
		: BaseOptions;

type ButtonComponent = Components<ActionRowType.Button>;
type ModalComponent = Components<ActionRowType.Modal>;
type MenuComponent = Components<ActionRowType.SelectMenu>;

export abstract class Components<K extends ActionRowType>
	implements ClientComponent<K>
{
	readonly type: K;
	readonly customId: string;
	readonly options?: ComponentOptions<K>;

	constructor(component: ClientComponent<K>) {
		this.customId = component.customId;
		this.type = component.type;
		this.options = component.options;
	}

	public abstract run(
		interaction: ComponentInteractions[K],
		client: ExtendedClient,
	): Awaitable<any>;

	public isButton(): this is ButtonComponent {
		return this.type === ActionRowType.Button;
	}

	public isModal(): this is ModalComponent {
		return this.type === ActionRowType.Modal;
	}

	public isMenu(): this is MenuComponent {
		return this.type === ActionRowType.SelectMenu;
	}

	private static async loadComponents(client: ExtendedClient): Promise<void> {
		const componentsFolderPath = resolve(__dirname, "../app/components");
		for (const folder of readdirSync(componentsFolderPath)) {
			const folderPath = join(componentsFolderPath, folder);
			for (const file of readdirSync(folderPath)) {
				try {
					const ComponentModule = await import(resolve(folderPath, file));
					const Component = new ComponentModule.default() as Components<any>;
					client.components.set(Component.customId, Component);
				} catch (error) {
					console.error(
						`Failed to load component from file: ${file} - `,
						error,
					);
				}
			}
		}
	}

	public static async registerComponents(
		client: ExtendedClient,
	): Promise<void> {
		await this.loadComponents(client);
	}

	public static getComponentById(
		id: string,
		client: ExtendedClient,
	): Components<ActionRowType> | undefined {
		return client.components.get(id);
	}
}
