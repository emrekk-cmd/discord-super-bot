const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai");
const play = require("play-dl");
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");

// Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
});

// OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Bot hazır olduğunda console.log
client.once("ready", () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

// Komutlar
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // !sor komutu
  if (message.content.startsWith("!sor")) {
    const soru = message.content.replace("!sor", "").trim();
    if (!soru) return message.reply("Lütfen bir soru yaz!");

    try {
      const cevap = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: soru }],
      });
      message.reply(cevap.choices[0].message.content);
    } catch (err) {
      console.error("OpenAI Hatası (!sor):", err);
      if (err.code === "insufficient_quota" || err.status === 429) {
        message.reply("OpenAI kotanı aştın veya kredin bitmiş olabilir. Kontrol et.");
      } else {
        message.reply("OpenAI ile bağlantı kurulamadı, lütfen sonra tekrar dene.");
      }
    }
  }

  // !resim komutu
  if (message.content.startsWith("!resim")) {
    const prompt = message.content.replace("!resim", "").trim();
    if (!prompt) return message.reply("Lütfen bir resim açıklaması yaz!");

    try {
      const img = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024",
      });
      message.reply(img.data[0].url);
    } catch (err) {
      console.error("OpenAI Hatası (!resim):", err);
      if (err.code === "insufficient_quota" || err.status === 429) {
        message.reply("OpenAI kotanı aştın veya kredin bitmiş olabilir. Kontrol et.");
      } else {
        message.reply("OpenAI ile bağlantı kurulamadı, lütfen sonra tekrar dene.");
      }
    }
  }

  // !play komutu
  if (message.content.startsWith("!play")) {
    const query = message.content.replace("!play", "").trim();
    if (!query) return message.reply("Lütfen bir müzik ismi veya URL yaz!");

    const channel = message.member.voice.channel;
    if (!channel) return message.reply("Önce bir ses kanalına katıl!");

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

      message.reply(`🎵 Şimdi çalıyor: ${query}`);
    } catch (err) {
      console.error("Müzik Hatası (!play):", err);
      message.reply("Müzik oynatılamadı. Geçerli bir link veya şarkı adı girildiğinden emin ol.");
    }
  }
});

// Discord Token ile giriş
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("Discord token ile giriş başarılı!"))
  .catch(err => console.error("Discord token hatası:", err));
