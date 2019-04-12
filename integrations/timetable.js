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
var cronString = {
    prod: "0 7-16 * * 1-5",
    dev: "* * * * 1-5"
}

var postToDB = function (content) {
    var timeTableObj = {
        user: "jace",
        date: new Date().toISOString(),
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

var jace = '190324801821212672';
module.exports = {
    start: function (bot) {
        schedule.scheduleJob(cronString.dev, function () {
            var d = new Date();
            console.log(d.toISOString());
            bot.fetchUser(jace).then(function (user) {
                var d = new Date();
                user.send('What\'s up?').then(function (message) {
                    //collection = new bot.MessageCollector(message.channel,function(){},{max:1});
                    var collector = message.channel.createMessageCollector(function () { return true }, { time: 1 * 20 * 1000 });
                    collector.on('collect', m => {
                        console.log(`Collected ${m.content}`);
                    });

                    collector.on('end', collected => {
                        var e = new Date();
                        console.log(`Collected ${collected.size} items ${e.toISOString()}`);
                        var messages = collected.map(function (message) {
                            return message.content;
                        });
                        console.log(messages.toString());
                        /**
                         * Make connection to DB and post.
                         */
                        postToDB(messages.toString());
                    });
                });
            });
        });
    }
};