const Chance = require('chance').Chance()
const CSVParser = require('csv-parser')
const FS = require('fs')

module.exports = (interaction) => {
  let allBirds = []

  FS.createReadStream('ebird_taxonomy.csv')
    .pipe(CSVParser())
    .on('data', (data) => allBirds.push(data))
    .on('end', () => {
      const randomBird = Chance.integer({
        min: 0,
        max: allBirds.length
      })

      interaction.reply({
        content: `https://ebird.org/species/${allBirds[randomBird].SPECIES_CODE}`
      })
    })
}
