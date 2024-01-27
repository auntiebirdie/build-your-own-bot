Let's have a little fun and do something silly: how about a random bird command!

There are a couple different bird checklists, but for this, we are going to use the Clements checklist because it's tied in with eBird.org.

I grabbed the [CSV version of eBird taxonomy checklist from the Cornell website](https://www.birds.cornell.edu/clementschecklist/introduction/updateindex/october-2023/download/) via **curl**, installed the **unzip** package, and unzipped the file to get the CSV.

Next, we install two libraries: **csv-parser** and **chance**. While you can absolutely write a little script to grab random numbers, I like to use the Chance library to make things a lot easier, so let's get familiar with it now.

Let's get started with reading the CSV we downloaded. The csv-parser library provides a great example in their documentation that we can adapt a bit.

As a note, I like to capitalize libraries and other included files, which is a personal preference and not something you have to do, too.

```js
const Chance = require('chance').Chance()
const CSVParser = require('csv-parser')
const FS = require('fs')

module.exports = (interaction) => {
  let allBirds = []

  FS.createReadStream('ebird_taxonomy.csv')
    .pipe(CSVParser())
    .on('data', (data) => allBirds.push(data))
    .on('end', () => {
      console.log(allBirds[0])
  })
}
```

When I'm working with new code, I tend to log to the console a lot. We can see that the csv-parser library turns the rows into an object with the header as keys, and all we need for this is the **SPECIES_CODE** data, because that's what eBird uses in their URLs.

Chance has a pickone method that picks a random element from an array, but I'm opting to just grab a random index and use that because there's over 10,000 birds, and this felt much more efficient to me.

```js
    [...]
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
```

That should do it! Now if we try the /bird command...

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/dd18bdb0-3098-4ed3-b740-7ef90f448064)

And we're done! 🐦
