const JSONdb = require('simple-json-db')

module.exports = (interaction) => {
  const db = new JSONdb(`db/servers/${interaction.guild.id}.json`)

  if (interaction.isChannelSelectMenu()) {
    const selectedChannel = interaction.values[0]

    interaction.webhook.deleteMessage(interaction.message.id).catch(() => {})

    db.set('channel', selectedChannel)

    interaction.reply({
      content: `Birthday announcements will now be made in <#${selectedChannel}>.`,
      ephemeral: true
    })
  } else {
    const currentChannel = db.get('channel')

    interaction.reply({
      content: 'Which channel would you like birthday announcements to be made in?' + (currentChannel ? ` The current announcement channel is <#${currentChannel}>.` : ''),
      ephemeral: true,
      components: [{
        type: 1,
        components: [{
          type: 8,
          custom_id: 'set/channel',
          channel_types: [0]
        }]
      }]
    })
  }
}