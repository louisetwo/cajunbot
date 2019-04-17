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
var props = {
    minutesToWait: 5,
    cronString: "0 7-16 * * 1-5",
    devCronString: "* * * * 1-5"
}

var postToDB = function (content, user) {
    var now = new Date();
    var timeTableObj = {
        user: user,
        date: now,
        lodaldate: now.toLocaleString(),
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
var getFromDB = function (filter, msg) {
    MongoClient.connect(mongoURI, {
        useNewUrlParser: true
    }, function (err, client) {
        if (err) console.log(err);
        var db = client.db('cajonbot');
        db.collection('timetable').findOne(filter, function (err, result) {
            var message;
            if (err) {
                message = JSON.stringify(err);
            }
            if (result) {
                message = JSON.stringify(result);
            }
            msg.channel.send(message);
            client.close();
        });
    });
};
/**
 * command: function(bot, msg) {
        var phrase = '!jace';
        if (msg.author.bot === false) {
            var wordsArr = msg.content.split(' ');
            wordsArr.map(function(word, index) {
                if (word.toLowerCase() === phrase) {
                    var term = wordsArr[index + 1];
                    var message = 'https://blog.jacebenson.com/' + encodeURI(wordsArr.join(' ').replace(word, '').trim());
                    msg.channel.send(message);
                }
            });
        }
    },
    help: '`!jace string` Searchs jaces blog for the string provided.'
 */

var jace = '190324801821212672';
module.exports = {
    start: function (bot) {
        bot.on("message", function(msg) {
            if(msg.author.id === jace){
                var now = new Date();
                var date = {
                    today: now.toISOString(),
                    t: now.toISOString(),
                    yesterday: now.setDate(now.getDate()-1).toISOString(),
                    y: now.setDate(now.getDate()-1).toISOString(),
                    thisweek: now.setDate(now.getDate()-7).toISOString(),
                    tw: now.setDate(now.getDate()-7).toISOString(),
                }
                var phrases = {
                    '!today':       {date:      {"$gt": date.today}},
                    '!t':           {t:         {"$gt": date.t}},
                    '!yesterday':   {yesterday: {"$gt": date.yesterday}},
                    '!y':           {y:         {"$gt": date.y}},
                    '!thisweek':    {thisweek:  {"$gt": date.thisweek}},
                    '!tw':          {tw:        {"$gt": date.tw}},
                    '!all':         {}
                };
                if (msg.author.bot === false) {
                    var wordsArr = msg.content.split(' ');
                    wordsArr.map(function(word, index) {
                        for(var phrase in phrases){
                            if (word.toLowerCase() === phrase) {
                                var message = JSON.stringify(phrases[phrase]);
                                msg.channel.send(message);
                                getFromDB(phrases[phrase], msg);
                            }
                        }
                    });
                }
            }
        });
        schedule.scheduleJob(props.cronString, function () {
            var d = new Date();
            console.log(d.toISOString());
            bot.fetchUser(jace).then(function (user) {
                var d = new Date();
                user.send('What\'s up?').then(function (message) {
                    //collection = new bot.MessageCollector(message.channel,function(){},{max:1});
                    var collector = message.channel.createMessageCollector(function () { return true }, { time: 50 * 20 * 1000 });
                    collector.on('collect', m => {
                        if (m.author.id === jace) {
                            console.log(`Collected ${m.content}`);
                            collector.stop();
                        }
                    });

                    collector.on('end', collected => {
                        var e = new Date();
                        console.log(`Collected ${collected.size} items ${e.toISOString()}`);
                        var messages = collected.map(function (message) {
                            return message.content;
                        });
                        if (messages.length > 0) {
                            console.log(messages.toString());
                            /**
                             * Make connection to DB and post.
                             */
                            postToDB(messages.toString());
                        }
                        user.send("Awesome, logged.");
                    });
                });
            });
        });
    }
};