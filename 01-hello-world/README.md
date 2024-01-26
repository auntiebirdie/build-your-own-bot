There are two things you need to build your own Discord bot: the code and a server to host it. You can, of course, run the code on your local machine, but it might be easier to spin up a small server (for free!) to leave running 24/7 instead of your computer.

Both Google and Amazon offer "always free" tiers for their instance services, so long as you meet the requirements. I use Google Cloud myself, so I'm only familiar with the rules and caveats for their free tier.

In order to qualify for the free tier in GCP, your instance must be:
- The **e2-micro** instance type
- In the **us-west1**, **us-central1**, or **us-east1** region
- Have a 30GB or smaller **standard** persistent disk (note that this defaults to **balanced** when creating a new instance)

Wherever you plan to host your bot, you'll next need to set up your environment for development. The two most common Discord bot libraries are available in Node.js or Python. Since I use Node.js myself, that will be what my tutorials use.

Once you have Node.js installed and are in the folder where you'd like your bot to live, the first step is to run:

```
npm install discord.js
```

This will set you up with the Discord.js library. Now we can get to bringing your bot to life!

*Note:* If you haven't already, you'll need an application ID and bot token from Discord.  You can follow [Step 1 of their official guide](https://discord.com/developers/docs/getting-started) to get these values.

I like to use a JSON file where I store my secrets and have that file excluded in my .gitignore declarations. You can also use environment variables, a .env file, or even hardcode the values if you really want.

The bare minimum needed to get your bot online looks something like this:

```js
const { Client } = require('discord.js')
const Secrets = require('./secrets.json')

const client = new Client({
  intents: []
})

client.login(Secrets.DISCORD.BOT_TOKEN)
```

If you run this code, your bot will now be online! It won't do anything, so let's fix that by having it respond to "hello" with "Hello, world!"

To do so, we will need to add a privileged intent that allows the bot to read message content. The toggle for this is on the Bot page of the Discord Applications section.

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/1a22bee9-8730-40ef-9ed3-2217318952f4)

Now we need to update our code to declare the necessary intents, including the privileged one:

```js
const { Client, GatewayIntentBits } = require('discord.js')
const Secrets = require('./secrets.json')

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
})

client.login(Secrets.DISCORD.BOT_TOKEN)
```

*(FYI: "Guilds" refers to what we call Servers.)*

And now we can add a listener for the messageCreate event. To start with, we're just going to log the message so you can see all the information that's returned.

```js
client.on('messageCreate', (message) => {
  console.log(message)
})
```

Now run the code to bring the bot online and send any message in the server you share with it. You should see a lot of information, but most importantly is the content attribute. That's what we're going to use to have our bot respond to "hello"... something like this:

```js
client.on('messageCreate', (message) => {
  if (message.content == 'hello') {
    message.reply({
      content: 'Hello, world!'
    })
  }
})
```

![image](https://github.com/auntiebirdie/build-your-own-bot/assets/83483301/115a32c6-8f84-4e79-9b50-04e493f43cd1)

This is, of course, not ideal—it's not accounting for capitalization or punctuation, sure, but there's another thing to keep in mind. When the bot sends a message, that also generates a messageCreate event! Because of this, I always put in an extra check for my messageCreate events to disregard messages from bots.

```js
  if (!message.author.bot) {
    /*...*/
  }
```

If you have other bots that you want to process the messages for by this bot, then you could instead check to make sure the message isn't authored by the bot itself.

```js
  if (message.author.id != client.user.id) {
    /*...*/
  }
```

... the possibilities are endless and up to you.

While this bot doesn't do anything very exciting, it lays the foundation for us to build on to make just about anything you need or want. In the next tutorial, I'll go over how to add slash commands!
