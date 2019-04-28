var MongoClient = require('mongodb').MongoClient;
var mongoURI = process.env.MONGODB_URI;
var schedule = require('node-schedule');

/**
 * Prod string
 * "0 7-16 * * 1-5"
 * “At minute 0 past every hour from 7 through 16 on every day-of-week from Monday through Friday.” 
 * 
 * Testing string
 * "* * * * 1-5"
 * “At every minute on every day-of-week from Monday through Friday.” 
 */
function remindUser(userObj, bot) {
    try {
        var t = userObj.cajunbotFeatures.timeTable;
        console.log(userObj.name, userObj.discordId, t);
        schedule.scheduleJob(t.schedule, function () {
            bot.fetchUser(userObj.discordId).then(function (user) {
                user.send('Testing\'s up?').then(function (message) {
                    //collection = new bot.MessageCollector(message.channel,function(){},{max:1});
                    var collector = message.channel.createMessageCollector(function () { return true }, { time: 15 * 20 * 1000 });
                    collector.on('collect', m => {
                        if (m.author.id === userObj.discordId) {
                            console.log(`Collected ${m.content}`);
                            collector.stop();
                        }
                    });

                    collector.on('end', collected => {
                        var e = new Date();
                        console.log(`Collected ${collected.size} items ${e}`);
                        var messages = collected.map(function (message) {
                            return message.content;
                        });
                        if (messages.length > 0) {
                            console.log('Posting to db...' + messages.toString());
                            postToDB(messages.toString(), userObj);
                        }
                        user.send("Awesome, logged.");
                    });
                });
            });
        });
    } catch (error) {
        console.log('error in f', error);
    }
}

var postToDB = function (content, userObj) {
    var now = new Date();
    var timeTableObj = {
        user: userObj.discordId,
        date: now,
        comment: content.replace(/,/gm, '\n')
    };
    MongoClient.connect(mongoURI, {
        useNewUrlParser: true
    }, function (err, client) {
        if (err) console.log(err);
        var db = client.db('cajonbot');
        db.collection('timetable').insertOne(timeTableObj, function (err, result) {
            if (err) {
                console.log(err);
                client.close();
            } else {
                if (result) {
                    console.log('inserted entry');
                } else {
                    console.log('result falsy');
                }
                client.close();
            }
        });
    });
}

module.exports = {
    start: function (bot) {
        try {
            MongoClient.connect(mongoURI, {
                useNewUrlParser: true
            }, function (err, client) {
                if (err) console.log(err);
                var filter = { "cajunbotFeatures.timeTable.active": true };
                var db = client.db('cajonbot');
                db.collection('users').find(filter).toArray(function (err, result) {
                    result.forEach(function (user) {
                        if (user.cajunbotFeatures.timeTable.active) {
                            remindUser(user,bot);
                        }
                    });
                });
            });
        } catch (error) {
            console.log('error', error);
        }
    }
};
