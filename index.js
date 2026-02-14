const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai");
const play = require("play-dl");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");

// ----- Client Setup -----
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
});

// ----- OpenAI Setup -----
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ----- Müzik player için global değişken -----
let player;
let connection;

// ----- Mesaj eventi -----
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ---------------- !sor komutu ----------------
  if (message.content.startsWith("!sor")) {
    try {
      const soru = message.content.replace("!sor", "").trim();
      if (!soru) return message.reply("Bir soru yazmalısın!");
      const cevap = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: soru }],
      });
      message.reply(cevap.choices[0].message.content);
    } catch (err) {
      console.error(err);
      message.reply("Bir hata oluştu, tekrar dene.");
    }
  }

  // ---------------- !resim komutu ----------------
  if (message.content.startsWith("!resim")) {
    try {
      const prompt = message.content.replace("!resim", "").trim();
      if (!prompt) return message.reply("Ne çizmek istediğini yazmalısın!");
      const img = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024",
      });
      message.reply(img.data[0].url);
    } catch (err) {
      console.error(err);
      message.reply("Resim oluşturulamadı.");
    }
  }

  // ---------------- !play komutu ----------------
  if (message.content.startsWith("!play")) {
    const query = message.content.replace("!play", "").trim();
    if (!query) return message.reply("Bir şarkı ismi veya linki yazmalısın!");
    const channel = message.member.voice.channel;
    if (!channel) return message.reply("Önce bir ses kanalına girmen gerekiyor.");

    try {
      // Eğer daha önce connection yoksa oluştur
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
        });
      }

      // Player yoksa oluştur
      if (!player) {
        player = createAudioPlayer();
        connection.subscribe(player);

        // Müzik bittiğinde cleanup
        player.on(AudioPlayerStatus.Idle, () => {
          player = null;
          connection.destroy();
          connection = null;
        });
      }

      const stream = await play.stream(query);
      const resource = createAudioResource(stream.stream);
      player.play(resource);
      message.reply(`🎵 Şimdi çalınıyor: ${query}`);
    } catch (err) {
      console.error(err);
      message.reply("Şarkı çalarken bir hata oluştu.");
    }
  }

  // ---------------- !stop komutu ----------------
  if (message.content === "!stop") {
    if (player) player.stop();
    if (connection) {
      connection.destroy();
      connection = null;
    }
    message.reply("Müzik durduruldu ve kanaldan çıkıldı.");
  }
});

client.login(process.env.DISCORD_TOKEN);
