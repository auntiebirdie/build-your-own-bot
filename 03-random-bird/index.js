const {
  Client,
  GatewayIntentBits
} = require('discord.js')
const Secrets = require('./secrets.json')

const client = new Client({
  intents: []
})

client.login(Secrets.DISCORD.BOT_TOKEN)

client.on('interactionCreate', (interaction) => {
  require(`./interactions/${interaction.commandName}.js`)(interaction)
})
