const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const express = require("express");

const app = express();
app.use(express.json());

// ================= CONFIG =================
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
// ==========================================

const client = new Client({
	intents: [GatewayIntentBits.Guilds]
});

// code -> { robloxId, expires }
const codes = {};

// ================= API =================
app.post("/register", (req, res) => {
	const { robloxId, code, expires } = req.body;

	if (!robloxId || !code || !expires)
		return res.sendStatus(400);

	codes[code] = { robloxId, expires };
	console.log("Registered:", code);

	res.sendStatus(200);
});

// ================= DISCORD =================
client.once("ready", async () => {
	console.log(`Bot online as ${client.user.tag}`);

	const commands = [
		new SlashCommandBuilder()
			.setName("link")
			.setDescription("Link your Roblox account")
			.addStringOption(opt =>
				opt.setName("code")
					.setDescription("Code from Roblox")
					.setRequired(true)
			)
	].map(cmd => cmd.toJSON());

	const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
	await rest.put(
		Routes.applicationCommands(client.user.id),
		{ body: commands }
	);
});

client.on("interactionCreate", async interaction => {
	if (!interaction.isChatInputCommand()) return;
	if (interaction.commandName !== "link") return;

	const code = interaction.options.getString("code");
	const data = codes[code];

	if (!data)
		return interaction.reply({ content: "❌ Invalid code.", ephemeral: true });

	if (Date.now() / 1000 > data.expires)
		return interaction.reply({ content: "⌛ Code expired.", ephemeral: true });

	console.log(`Linked Discord ${interaction.user.id} → Roblox ${data.robloxId}`);
	delete codes[code];

	interaction.reply({
		content: "✅ Roblox account linked successfully!",
		ephemeral: true
	});
});

// ================= START =================
client.login(BOT_TOKEN);

app.listen(PORT, () => {
	console.log(`API running on port ${PORT}`);
});
