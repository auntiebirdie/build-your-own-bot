Now that we have a bot that can store and retrieve a user's birthday, we want it to be able to announce birthdays at a specific time in a specific channel.

What I'm going to do first is write the logic that announces to a hardcoded channel that it's someone's birthday, then add the configuration and plug the settings into the code.

First thing's first: we're going to need access to guild/server members, which is a privileged intent. Head to the Discord Applications page and go to the Bot section of your application to select the Server Members toggle.

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/7254d925-dbae-45d2-b753-9f14039f3f48)

And update the intents array passed to the new Client:

```js
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
})
```

Now we can add a **ready** event listener to our **index.js** so we can check for birthdays, like this:

```js
const JSONdb = require('simple-json-db')

/* ... */

client.on('ready', () => {
  client.guilds.cache.each((guild) => {
    guild.members.fetch().then((members) => {
      members = members.filter((member) => !member.user.bot)

      members.each((member) => {
        const db = new JSONdb(`db/${member.id}.json`)
        const birthdayData = db.get('birthday')

        if (birthdayData) {
          console.log(member.id, birthdayData.month, birthdayData.day)
        }
      })
    })
  })
})
```

When the bot is connected and ready, it will now log the birthday data for users who have set their birthday (most likely just you during testing).

If you don't already have Developer Mode turned on, now is a good time!  Head to Settings -> Advanced and toggle Developer Mode on. This will let you copy the ID of things (users, servers, channels) and is needed for this next part.

Right-click on the channel you'd like to send a test announcement to and copy the channel ID, then paste it where indicated below. We're hardcoding this for now while testing, but we'll move this to a configurable setting later.

```js
  client.guilds.cache.each(async (guild) => {
    const channel = await guild.channels.fetch('CHANNEL_ID')

    guild.members.fetch().then((members) => {
      members = members.filter((member) => !member.user.bot)

      members.each((member) => {
        const userDb = new JSONdb(`db/${member.id}.json`)
        const birthdayData = userDb.get('birthday')

        if (birthdayData) {
          channel.send(`Happy birthday, <@${member.id}>!`)
        }
      })
    })
  })
```

However, if there are multiple members... then this isn't ideal, because it'll send a message for every member. It'd be better if it sent one message with all the members listed, right? There's a handy built-in library that makes turning an array into a list and handles the logic of commas and "and".

```js
    guild.members.fetch().then((members) => {
      members = members.filter((member) => !member.user.bot)
      let birthdayMembers = []

      members.each((member) => {
        const userDb = new JSONdb(`db/${member.id}.json`)
        const birthdayData = userDb.get('birthday')

        if (birthdayData) {
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
```

Huzzah! Of course, this doesn't actually check for birthdays, because we wanted to test that it worked.

```js
client.on('ready', () => {
  const today = new Date()
  const currentMonth = today.getUTCMonth()
  const currentDay = today.getUTCDate()

  /* ... */

        if (birthdayData && birthdayData.month == currentMonth && birthdayData.day == currentDay) {
          birthdayMembers.push(`<@${member.id}>`)
        }
```

Note that I'm using getUTC because I intend to make this bot publicly available and I want to work with UTC+0.

Now, let's add the interval logic to do the announcement at a specified time.

There are so many ways you can do this. Cron jobs are an option, but I don't want to assume someone has access to those, so we're going to use a library called **node-cron** to use a cron job-like scheduler.

Install node-cron and update our **index.js** file to look like this:

```js
client.on('ready', () => {
  Cron.schedule('* * * * *', () => {
    client.guilds.cache.each(async (guild) => {
      /* ... */
    })
  })
})
```

Now when we run the bot, on the next minute, if you've set your birthday to today for testing purposes, it should wish you a happy birthday. And the next minute. And the next minute.

If you're not familiar with cron, then all you really need to know is that the first slot is minutes and the second slot is hours (24-hour clock). So to have the code run at 1pm, you would set it to '0 13 * * *'.

​In this case, I want the bot to run through its check every hour, so I'm sitting it to '0 * * * *'.

Now that we have all the code necessary to wish users a happy birthday, let's work on our configuration commands. We're going to leverage a new attribute: default_member_permissions.  Setting this to 0 will disable the command for everyone except admins by default.

```js
    {
      "name": "set",
      "description": "Configure settings.",
      "options": [{
        "name": "channel",
        "description": "Configure birthday announcement channel.",
        "type": 1,
        "dm_permission": false,
        "default_member_permissions": 0
      }, {
        "name": "time",
        "description": "Configure birthday announcement time.",
        "type": 1,
        "dm_permission": false,
        "default_member_permissions": 0
      }]
    }
```

This time, we are using "sub-commands", which lets us have branching commands (channel, time) using the same base command (set). I like them because it looks nice in the UI:

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/01d4e359-222a-4fea-86b9-ff2879773336)

The interaction command name here will be "set", meaning both commands will call the same file. There are a couple options, including:

1. Have the **set.js** file include ifs or a switch statement based on the subcommand (all logic in one file).
2. Have the **set.js** file redirect to other files based on the subcommand (logic separated in multiple files).
3. Update our **interactionCreate** event to dynamically figure out what file based on subcommand groups, subcommands, etc.
   
I go back and forth on which pattern I prefer and am honestly not consistent with it myself. I think I'd like to use #3 more in my own projects, so let's write that code now!

Subcommands can be nested under subcommand groups or standalone. You can check [the official documentation from Discord](https://discord.com/developers/docs/interactions/application-commands#subcommands-and-subcommand-groups) for more information.

​So something like...

```js
client.on('interactionCreate', (interaction) => {
  let path = `./interactions/${interaction.commandName}`

  if (interaction.options?.getSubcommandGroup(false)) {
    path += `/${interaction.options.getSubcommandGroup()}`
  }

  if (interaction.options?.getSubcommand(false)) {
    path += `/${interaction.options.getSubcommand()}`
  }

  require(`${path}.js`)(interaction)
})
```

Now our bot will dynamically route to the corresponding file for a command!

So for the set command, we need a subfolder called **set** and two files: **channel.js** and **time.js**. Let's start with the channel function first.

```js
module.exports = (interaction) => {
  interaction.reply({
    content: 'Which channel would you like birthday announcements to be made in?',
    ephemeral: true,
    components: [{
      type: 1,
      components: [{
        type: 8,
        custom_id: 'channel',
        channel_types: [0]
      }]
    }]
  })
}
```

Message components are fun but a little complicated at times, so I recommend spending some time with [the official documentation](https://discord.com/developers/docs/interactions/message-components) for more information.

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/e8e19280-a36c-4f3d-84a4-8cda61f9fc46)

Of course, making a selection will throw an error because our code isn't prepared for receiving select menus like this!

If you console.log the incoming interaction, you'll notice there's no command name anymore. There is, however, interaction information on the referenced message, but it's in a new format...

What I do may be a hack, but it works for me. I include the filename in the custom_id of my component, like this:

```js
      components: [{
        type: 8,
        custom_id: 'set/channel',
        channel_types: [0]
      }]
```

... and in my interactionCreate event, check to see if the incoming interaction is a message component and manipulate the data to match what I need.

```js
const {
  Client,
  GatewayIntentBits,
  InteractionType
} = require('discord.js')

/* ... */

client.on('interactionCreate', (interaction) => {
  if (interaction.type == InteractionType.MessageComponent) {
    let tmp = interaction.customId.split('_')
    interaction.commandName = tmp.shift()
    interaction.customId = tmp.join('_')
  }
```

Now if we select something from the channel list, we'll get the same message again... which is progress!

```js
module.exports = (interaction) => {
  if (interaction.isChannelSelectMenu()) {
    interaction.reply({
      content: `You have selected <#${interaction.values[0]}>`,
      ephemeral: true
    })
  } else {
    /* ... */
```

More progress! But let's clean up after ourselves. Ephemeral messages are a little trickier to work with than regular messages, as they can only be edited or deleted for up to 15 minutes after they're sent.

interaction.webhook.deleteMessage(interaction.message.id).catch(() => {})

I include a silent catch for this because if the message fails to delete because someone ran the command, walked away for over 15 minutes, and came back... I want the code to still work, even if it doesn't "clean up" the message. There are other cases where I want it to explicitly fail, but this isn't one of them.

The last step for this command is to have it actually save the channel ID somewhere for later retrieval. I'm going to do a little refactoring here and also update the other code to save and retrieve user birthday information from a subfolder in the **db** folder, so there isn't any risk of overlap between server IDs and user IDs. My file structure will now look like this:

```
db/
 |- users/
 |   |- userID.json
 |
 |- servers/
     |- serverID.json
```

For the record, this means updating **birthday.js**, **check.js**, and **index.js**.

The **channel.js** file is now:

```js
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
```

Whew! One down, one to go. Time to set up our **time.js** file. We will use a similar layout, just using a string select menu and not a channel select menu... and we're going to get a little fancy with Discord's relative time syntax.

Let's start here, to keep things simple, using the code we already wrote as a starting point with some additions:

```js
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

  if (interaction.isStringSelectMenu()) {
    const selectedTime = interaction.values[0] * 1

    interaction.webhook.deleteMessage(interaction.message.id).catch(() => {})

    db.set('time', selectedTime)

    interaction.reply({
      content: `Birthday announcements will now be made at ${convertTime(selectedTime)} UTC.`,
      ephemeral: true
    })
  } else {
    const currentTime = db.get('time')

    let timeOptions = []

    for (let i = 0, len = 24; i < len; i++) {
      timeOptions.push({
        label: convertTime(i),
        value: `${i}`
      })
    }

    interaction.reply({
      content: 'What time would you like birthday announcements to be made at?' + (currentTime ? ` The current announcement time is ${convertTime(currentTime)} UTC.` : ''),
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
```

This is fully functional as is. But converting timezones isn't user-friendly for most people, so to try to make things easier, we're going to add in some little helpers to try to make figuring out what time to pick easier.

First, we're going to print out the current time in UTC in our first message:

```js
  } else {
    const today = new Date()
    const currentTime = db.get('time')

    /* ... */

    interaction.reply({
      content: `What time would you like birthday announcements to be made at? For reference, it is currently ${convertTime(today.getUTCHours())} UTC.` + (currentTime ? ` The current announcement time is ${convertTime(currentTime)} UTC.` : ''),
```

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/5956fcd4-43cb-4949-82e1-1773e74542ec)

And next we're going to tinker with relative timestamps. I couldn't find any official documentation on them, but I did find [this gist that explains them](https://gist.github.com/LeviSnoot/d9147767abeef2f770e9ddcd91eb85aa) well enough.

JavaScript's .getTime() functionality works with milliseconds, so we'll need to divide by 1000 to get the seconds value.

The end result is this:

```js
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
      content: `Birthday announcements will now be made at ${convertTime(selectedTime)} UTC ( in your local time).`,
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
      content: `What time would you like birthday announcements to be made at? For reference, it is currently ${convertTime(today.getUTCHours())} UTC.` + (currentTime ? `\r\n\r\nThe current announcement time is ${convertTime(currentTime)} UTC ( in your local time).` : ''),
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
```

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/5367db37-05b4-44f4-beb3-0be1a804ccb8)

We're almost done!  All we have left is to retrieve our configured values in the **index.js** file. I did a little refactoring around the channel fetching, just in case the specified channel is deleted or cannot be accessed by the bot. It will silently fail, so you may want to add your own error handling if you'd like.

```js
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
```

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/6e9acf88-faea-4d27-a99b-33bc3fd545c4)

Now you should be all set and ready to celebrate some birthdays! 🎉
