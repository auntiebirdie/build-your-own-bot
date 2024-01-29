const JSONdb = require('simple-json-db')

module.exports = (interaction) => {
  const inputMonth = interaction.options.getNumber('month')
  const inputDay = interaction.options.getNumber('day')
  const db = new JSONdb(`db/users/${interaction.user.id}.json`)

  db.set('birthday', {
    month: inputMonth,
    day: inputDay
  })

  const birthday = new Date()
  birthday.setMonth(inputMonth)
  birthday.setDate(inputDay)

  interaction.reply({
    content: `Your birthday has been set to ${birthday.toLocaleString('default', { month: 'long', day: 'numeric' })}.`,
    ephemeral: true
  })
}