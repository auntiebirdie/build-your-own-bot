const JSONdb = require('simple-json-db')

function convertTime(input) {
  if (input == 0) {
    return '12 AM'
  } else if (input < 12) {
    return `${input} AM`
  } else {
    return `${input == 12 ? 12 : input - 12} PM`
  }
}

module.exports = (interaction) => {
  const db = new JSONdb(`db/servers/${interaction.guild.id}.json`)
  const relativeDate = new Date()

  if (interaction.isStringSelectMenu()) {
    const selectedTime = interaction.values[0] * 1

    interaction.webhook.deleteMessage(interaction.message.id).catch(() => {})

    db.set('time', selectedTime)

    relativeDate.setUTCHours(selectedTime)
    relativeDate.setMinutes(0)

    interaction.reply({
      content: `Birthday announcements will now be made at ${convertTime(selectedTime)} UTC (<t:${Math.round(relativeDate.getTime() / 1000)}:t> in your local time).`,
      ephemeral: true
    })
  } else {
    const today = new Date()
    const currentTime = db.get('time')

    if (currentTime) {
      relativeDate.setUTCHours(currentTime)
      relativeDate.setMinutes(0)
    }

    let timeOptions = []

    for (let i = 0, len = 24; i < len; i++) {
      timeOptions.push({
        label: convertTime(i),
        value: `${i}`
      })
    }

    interaction.reply({
      content: `What time would you like birthday announcements to be made at? For reference, it is currently ${convertTime(today.getUTCHours())} UTC.` + (currentTime ? `\r\n\r\nThe current announcement time is ${convertTime(currentTime)} UTC (<t:${Math.round(relativeDate.getTime() / 1000)}:t> in your local time).` : ''),
      ephemeral: true,
      components: [{
        type: 1,
        components: [{
          type: 3,
          custom_id: 'set/time',
          options: timeOptions
        }]
      }]
    })
  }
}
