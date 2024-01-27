const Secrets = require('./secrets.json')
const {
  REST,
  Routes
} = require('discord.js')

const rest = new REST().setToken(Secrets.DISCORD.BOT_TOKEN)

rest.put(
  Routes.applicationCommands(Secrets.DISCORD.APPLICATION_ID), {
    body: [{
      "name": "bird",
      "description": "Fetch a random bird."
    }]
  }
)
