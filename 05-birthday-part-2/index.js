const {
  Client,
  GatewayIntentBits,
  InteractionType
} = require('discord.js')
const Cron = require('node-cron')
const JSONdb = require('simple-json-db')
const Secrets = require('./secrets.json')

const client = new Client({
  intents: [GatewayIntentBits.GuildMembers]
})

client.login(Secrets.DISCORD.BOT_TOKEN)

client.on('interactionCreate', (interaction) => {
  if (interaction.type == InteractionType.MessageComponent) {
    let tmp = interaction.customId.split('_')

    interaction.commandName = tmp.shift()
    interaction.customId = tmp.join('_')
  }


  let path = `./interactions/${interaction.commandName}`

  if (interaction.options?.getSubcommandGroup(false)) {
    path += `/${interaction.options.getSubcommandGroup()}`
  }

  if (interaction.options?.getSubcommand(false)) {
    path += `/${interaction.options.getSubcommand()}`
  }

  require(`${path}.js`)(interaction)
})

client.on('ready', () => {
  Cron.schedule('0 * * * *', () => {
    const today = new Date()
    const currentMonth = today.getUTCMonth()
    const currentDay = today.getUTCDate()
    const currentHour = today.getUTCHours()

    client.guilds.cache.each(async (guild) => {
      const serverDb = new JSONdb(`db/servers/${guild.id}.json`)
      const announcementTime = serverDb.get('time')

      if (announcementTime && announcementTime == currentHour) {
        const announcementChannel = serverDb.get('channel')

        if (announcementChannel) {
          guild.channels.fetch(announcementChannel).then((channel) => {
            guild.members.fetch().then((members) => {
              members = members.filter((member) => !member.user.bot)
              let birthdayMembers = []

              members.each((member) => {
                const userDb = new JSONdb(`db/users/${member.id}.json`)
                const birthdayData = userDb.get('birthday')

                if (birthdayData && birthdayData.month == currentMonth && birthdayData.day == currentDay) {
                  birthdayMembers.push(`<@${member.id}>`)
                }
              })

              if (birthdayMembers.length > 0) {
                let birthdayList = new Intl.ListFormat('en', {
                  style: 'long'
                }).format(birthdayMembers)

                channel.send(`Happy birthday, ${birthdayList}!`)
              }
            })
          }).catch(() => {})
        }
      }
    })
  })
})