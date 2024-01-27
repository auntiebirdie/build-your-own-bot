Slash commands can be hit or miss; I've seen a lot of casual Discord users who struggle with knowing how to use them. I think they're great because you don't have to try to parse every message looking for trigger commands.

For this tutorial, let's look at turning our simple 'hello' trigger into a slash command.

The first step is to register the command with Discord so that it can be used. Like everything, there are lots of ways to accomplish this. You can call the REST endpoint directly, or use Discord.js's helper functions to abstract some of the heavy-lifting logic.

Here is what it looks like to register a simple hello command:

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
      "name": "hello",
      "description": "Say hello."
    }]
  }
)
```

If you run this script, it will send the list of commands (in this case, just the one) to Discord and register them to your bot. You should be able to go to Discord now and type **/hello** and see your bot appear as an option, like this:

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/6b08eb61-cac6-45ec-bd2d-f793ab7784e3)

There is sometimes a delay between registering a global command and having it show up in Discord. Sometimes, quitting out of Discord completely and relaunching the application will cause them to appear.

You can also register guild/server-specific commands, which take effect immediately.

```js
  Routes.applicationGuildCommands(applicationId, guildId)
```

Whichever path you take, if you try to use the command, you'll receive *The application did not respond*... because we haven't told the bot what to do with slash commands yet.

Like before, let's listen to the event (this time, interactionCreate) just log the interaction to see what's going on:

```js
client.on('interactionCreate', (interaction) => {
  console.log(interaction)
})
```

Now when you send the /hello command, you'll see a bunch of data in your logs... what we care most about is **commandName**, because we can use that to know what command was sent.

In my projects, I create an **interactions** folder and create a file for each command with the same name. Again... a thousand ways you can do this! Do what makes the most sense to you.

My **hello.js**​ file looks like this:

```js
module.exports = (interaction) => {
  interaction.reply({
    content: 'Hello, world.'
  })
}
```

And in my main **index.js** file, I've updated the interactionCreate event listener to route incoming interactions based on their commandName attribute.

```js
client.on('interactionCreate', (interaction) => {
  require(`./interactions/${interaction.commandName}.js`)(interaction)
})
```

Now if we run our bot and try the /hello command...

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/e2a2f646-b76d-4b54-9bd4-1bc65fff554f)

Success! 🎉
