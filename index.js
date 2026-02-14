// index.js
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
  apiKey: process.env.OPENAI_API_KEY, // OPENAI API anahtarının doğru şekilde ayarlı olduğundan emin ol
});

// Yardımcı fonksiyon: hataları yakala
async function tryOpenAI(func, ...args) {
  try {
    return await func(...args);
  } catch (err) {
    console.error("OpenAI Hatası:", err);
    return null;
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // CHAT KOMUTU
  if (message.content.startsWith("!sor")) {
    const soru = message.content.replace("!sor", "").trim();
    if (!soru) return message.reply("Bir soru yazmalısın.");

    const cevap = await tryOpenAI(
      openai.chat.completions.create.bind(openai.chat.completions),
      {
        model: "gpt-3.5-turbo", // trial plan ile çalışır
        messages: [{ role: "user", content: soru }],
      }
    );

    if (!cevap) return message.reply("Bir hata oluştu, tekrar dene.");
    message.reply(cevap.choices[0].message.content);
  }

  // RESİM KOMUTU
  if (message.content.startsWith("!resim")) {
    const prompt = message.content.replace("!resim", "").trim();
    if (!prompt) return message.reply("Resim için bir konu yazmalısın.");

    const img = await tryOpenAI(
      openai.images.generate.bind(openai.images),
      {
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024",
      }
    );

    if (!img) return message.reply("Resim oluşturulamadı.");
    message.reply(img.data[0].url);
  }

  // MÜZİK KOMUTU
  if (message.content.startsWith("!play")) {
    const query = message.content.replace("!play", "").trim();
    if (!query) return message.reply("Bir şarkı adı yazmalısın.");

    const channel = message.member.voice.channel;
    if (!channel) return message.reply("Önce ses kanalına gir.");

    try {
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
    } catch (err) {
      console.error("Müzik Hatası:", err);
      message.reply("Şarkı çalarken bir hata oluştu.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN); // DISCORD_TOKEN doğru şekilde ayarlı olmalı
