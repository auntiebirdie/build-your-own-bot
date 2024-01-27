This time, we're going to do something a bit more complex: a bot that users can tell their birthday to that will then wish them a happy birthday on that day. This will involve:

- Accepting user input in the slash command
- Storing the user's birthday for later retrieval
- A command to check a user's birthday
- An interval check to look for birthdays to announce
- A configuration command for mods to set which channel birthday announcements go to

That may or may not seem like a lot—if it does, don't worry! The trick is to just take things one at a time and remember that you can always refactor what you've done if you find out you need to change something later.

Because date formats can vary by country, what we're going to do is have our slash command have input options for the day and month. Here's what this looks like for registering the command:

```js
const Secrets = require('./secrets.json')
const {
  REST,
  Routes
} = require('discord.js')

const rest = new REST().setToken(Secrets.DISCORD.BOT_TOKEN)

rest.put(
  Routes.applicationCommands(Secrets.DISCORD.APPLICATION_ID), {
    body: [{
      "name": "birthday",
      "description": "Set your birthday.",
      "options": [{
        "name": "month",
        "description": "Which month were you born?",
        "type": 10,
        "min_value": 1,
        "max_value": 12,
        "required": true
      }, {
        "name": "day",
        "description": "Which day were you born?",
        "type": 4,
        "min_value": 1,
        "max_value": 31,
        "required": true
      }]
    }]
  }
)
```

Here is [a link to the official documentation](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type) for what the different types of slash command options are. In this case, we're using type 10, which is numbers. Adding the min and max values means Discord will handle the validation for us.

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/d08f31f4-df60-49b4-ae23-458b615a2ba7)

To make things easier for the user, you can create a select list with the twelve months. You can't do the same for days because a select list is limited to a maximum of 25 options. Now, the month option will look like this:

```js
{
        "name": "month",
        "description": "Which month were you born?",
        "type": 10,
        "choices": [{
          "name": "January",
          "value": 0
        }, {
[...]
        }, {
          "name": "December",
          "value": 11
        }],
        "required": true
      }
```

Note that JavaScript Date functionality refers to months starting from 0. If you opt to use number input for months, note that you'll need to decrement the user input by 1.

The next step is to take in the user input so we can do something with it. To start, let's just take the input and reply with it to confirm the input is working as we want it to.

```js
module.exports = (interaction) => {
  const inputMonth = interaction.options.getNumber('month')
  const inputDay = interaction.options.getNumber('day')

  interaction.reply({
    content: `Your birthday is ${inputMonth} ${inputDay}.`
  })
}
```

If you input that your birthday is December 5, then you should see this in response:

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/eb2065c4-85fb-4794-b89b-170f844aba8d)

Remember, in JavaScript, 0 is January, and 11 is December.

Now, let's work on storing the data so we can retrieve it at our leisure for things like checking a user's birthday or announcing it on the day of. You can, of course, integrate with a database like MySQL or MongoDB. To keep things simple, we're going to use a library called **simple-json-db** that uses local JSON files as a database and is great for small projects.

After installing the library, create a **db** or **database** folder (or whatever you want to call it) where the JSON files will be stored, then let's return to our **interactions/birthday.js** file:

```js
const JSONdb = require('simple-json-db')

module.exports = (interaction) => {
  const inputMonth = interaction.options.getNumber('month')
  const inputDay = interaction.options.getNumber('day')
  const db = new JSONdb(`db/${interaction.user.id}.json`)

  db.set('birthday', {
    month: inputMonth,
    day: inputDay
  })

  interaction.reply({
    content: `Your birthday is ${inputMonth} ${inputDay}.`
  })
}
```

This will create a JSON file per user with their birthday saved as the data inside. If you want your bot to do other things, you may want to consider a subfolder for this information. You could also change it to have one single file with the user's ID as the key and the birthday information saved in the data. It really just depends on what works best for you, though I'd recommend separate files just to avoid collisions of multiple people setting their birthdays at the same time (unlikely, but it could happen, theoretically!).

Also, that reply—we don't really want to see something every time any user sets their birthday. This is where something called "ephemeral messages" come into play. They are messages that are only displayed to the user and no one else, which comes in handy for things like this. All that's needed is to set ephemeral to true on the reply:

```js
  interaction.reply({
    content: `Your birthday is ${inputMonth} ${inputDay}.`,
    ephemeral: true
  })
```

And now when we run the command, we see this:

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/e1034db1-285e-470c-84a9-6fd7545824ab)

While we're here, let's make the response a little more user-friendly. For example...

```js
  const birthday = new Date()
  birthday.setMonth(inputMonth)
  birthday.setDate(inputDay)

  interaction.reply({
    content: `Your birthday has been set to ${birthday.toLocaleString('default', { month: 'long', day: 'numeric' })}.`,
    ephemeral: true
  })
```

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/d65e8fd8-0b26-4b6a-b1a4-a48f2a85f1ae)

All right! Now, let's put together a function to check another user's birthday.

```js
    body: [{
      "name": "birthday",
      "description": "Set your birthday.",
      "options": [{
        /* ... */
      }]
    }, {
      "name": "check",
      "description": "Check a user's birthday.",
      "options": [{
        "name": "user",
        "description": "Whose birthday do you want to check?",
        "type": 6,
        "required": true
      }]
    }]
```

Type 6 is a user select menu that looks like this:

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/60d1bb7d-e3cf-45e6-a2c2-a3ce647e61b6)


It lets the user select any user in the server as the option value. Now to retrieve the selected user's birthday information and displaying it as an ephemeral message to the user who requested the information:

```js
const JSONdb = require('simple-json-db')

module.exports = (interaction) => {
  const targetUser = interaction.options.getUser('user')
  const db = new JSONdb(`db/${targetUser.id}.json`)
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
```

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/141c1f42-814a-4a20-a95d-dcb2769fa8ed)

I like to use the @user because it will do the logic of getting the user's correct display name (since there's "global" display names and "server" display names), and is a clickable target that you can action on if needed or wanted.

I think that's a good place to pause, as it's a fully functional bot as-is. In part two, we'll look at having the bot go the extra mile of announcing birthdays, as well as the configuration needed to allow admins to pick what channel announcements happen in and when they happen.
