const JSONdb = require('simple-json-db')

module.exports = (interaction) => {
  const targetUser = interaction.options.getUser('user')
  const db = new JSONdb(`db/users/${targetUser.id}.json`)
  const birthdayData = db.get('birthday')

  if (birthdayData) {
    const birthday = new Date()
    birthday.setMonth(birthdayData.month)
    birthday.setDate(birthdayData.day)

    interaction.reply({
      content: `<@${targetUser.id}>'s birthday is ${birthday.toLocaleString('default', { month: 'long', day: 'numeric' })}.`,
      ephemeral: true
    })
  } else {
    interaction.reply({
      content: `<@${targetUser.id}> hasn't set their birthday yet.`,
      ephemeral: true
    })
  }
}