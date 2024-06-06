import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const envSchema = z.object({
	APP_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
	console.error("Invalid environment variables:", env.error.format());
	process.exit(1);
}

export const config = env.data;
