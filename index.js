const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai");
const play = require("play-dl");
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!sor")) {
    const soru = message.content.replace("!sor", "");
    const cevap = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: soru }],
    });
    message.reply(cevap.choices[0].message.content);
  }

  if (message.content.startsWith("!resim")) {
    const prompt = message.content.replace("!resim", "");
    const img = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024",
    });
    message.reply(img.data[0].url);
  }

  if (message.content.startsWith("!play")) {
    const query = message.content.replace("!play", "");
    const channel = message.member.voice.channel;
    if (!channel) return message.reply("Ses kanalına gir.");
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
    const stream = await play.stream(query);
    const resource = createAudioResource(stream.stream);
    const player = createAudioPlayer();
    connection.subscribe(player);
    player.play(resource);
  }
});

client.login(process.env.DISCORD_TOKEN);
