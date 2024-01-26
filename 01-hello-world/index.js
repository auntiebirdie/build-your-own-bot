const {
  Client,
  GatewayIntentBits
} = require('discord.js')
const Secrets = require('./secrets.json')

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
})

client.login(Secrets.DISCORD.BOT_TOKEN)

client.on('messageCreate', (message) => {
  if (!message.author.bot) {
    if (message.content == 'hello') {
      message.reply({
        content: 'Hello, world!'
      })
    }
  }
})
