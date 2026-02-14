// index.js
const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai");
const play = require("play-dl");
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");

// -------------------- Client ve OpenAI --------------------
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

// -------------------- Token Kontrol --------------------
console.log("Bot başlatılıyor...");
console.log("OpenAI Key:", process.env.OPENAI_API_KEY ? "Var ✅" : "Yok ❌");
console.log("Discord Token:", process.env.DISCORD_TOKEN ? "Var ✅" : "Yok ❌");

// -------------------- Bot Hazır --------------------
client.once("ready", () => {
  console.log(`Bot online: ${client.user.tag}`);
});

// -------------------- Mesaj Komutları --------------------
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // --- !sor komutu (ChatGPT) ---
  if (message.content.startsWith("!sor")) {
    const soru = message.content.replace("!sor", "").trim();
    if (!soru) return message.reply("Sorunu yazmalısın.");

    try {
      const cevap = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: soru }],
      });
      message.reply(cevap.choices[0].message.content);
    } catch (err) {
      console.error("OpenAI Hatası:", err);
      message.reply("OpenAI ile iletişimde bir hata oluştu.");
    }
  }

  // --- !resim komutu (Resim Üretimi) ---
  if (message.content.startsWith("!resim")) {
    const prompt = message.content.replace("!resim", "").trim();
    if (!prompt) return message.reply("Resim için bir açıklama yazmalısın.");

    try {
      const img = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024",
      });
      message.reply(img.data[0].url);
    } catch (err) {
      console.error("OpenAI Resim Hatası:", err);
      message.reply("Resim oluşturulurken bir hata oluştu.");
    }
  }

  // --- !play komutu (Müzik Çalma) ---
  if (message.content.startsWith("!play")) {
    const query = message.content.replace("!play", "").trim();
    if (!query) return message.reply("Çalmak istediğin şarkıyı yazmalısın.");

    const channel = message.member.voice.channel;
    if (!channel) return message.reply("Önce bir ses kanalına katılmalısın.");

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
      message.reply(`🎶 Şimdi çalıyor: ${query}`);
    } catch (err) {
      console.error("Müzik Hatası:", err);
      message.reply("Şarkı çalarken bir hata oluştu.");
    }
  }
});

// -------------------- Bot Login --------------------
client.login(process.env.DISCORD_TOKEN);
