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
        "choices": [{
          "name": "January",
          "value": 0
        }, {
          "name": "February",
          "value": 1
        }, {
          "name": "March",
          "value": 2
        }, {
          "name": "April",
          "value": 3
        }, {
          "name": "May",
          "value": 4
        }, {
          "name": "June",
          "value": 5
        }, {
          "name": "July",
          "value": 6
        }, {
          "name": "August",
          "value": 7
        }, {
          "name": "September",
          "value": 8
        }, {
          "name": "October",
          "value": 9
        }, {
          "name": "November",
          "value": 10
        }, {
          "name": "December",
          "value": 11
        }],
        "required": true
      }, {
        "name": "day",
        "description": "Which day were you born?",
        "type": 10,
        "min_value": 1,
        "max_value": 31,
        "required": true
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
    }, {
      "name": "set",
      "description": "Configure settings.",
      "options": [{
        "name": "channel",
        "description": "Configure birthday announcement channel.",
        "type": 1
      }, {
        "name": "time",
        "description": "Configure birthday announcement time.",
        "type": 1
      }]
    }]
  }
)