require('dotenv').config();
var fs = require('fs');
//var Eris = require('eris');
//var bot = new Eris(process.env.DISCORD_BOT_TOKEN);
var Discord = require('discord.js');
var bot = new Discord.Client();
var token = process.env.DISCORD_BOT_TOKEN;
var responses = {};
var responsesDirectory = './responses/';

fs.readdir(responsesDirectory, function(err, files) {
  files.forEach(function(file) {
  try {
    responses[file] = require(responsesDirectory + file);
  } catch (e) {
    console.log(e);
  }
  });
});
bot.login(token);
bot.on('ready', () => { // When the bot is ready
    console.log('CajonBot Ready!'); // Log "Ready!"
    for(var response in responses){
        console.log(response, typeof responses[response].start);
        if(typeof responses[response].start === 'function'){
            console.log('should start?');
        }
        //responses[response].command(bot, msg, responses);
      }
    //require('./integrations/reminder').start(bot);//disabled after token was revoked
});
//var reminderCommands = require('./responses/reminder');
//bot.on("message", function(msg) {
//    reminderCommands.command(bot, msg, {});
//});
process.on('unhandledRejection', console.error);