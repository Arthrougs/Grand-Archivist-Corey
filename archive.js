const Discord = require("discord.js");
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const client = new Discord.Client();

let rawdata = fs.readFileSync('auth.json');
let auth = JSON.parse(rawdata);

var url = "mongodb://192.168.1.25:27017/";
var protectedChannels = [];
var dbo;

//Open Database connection
MongoClient.connect(url, {useNewUrlParser: true }, function(err, db) {
    if(err) throw err;
     dbo = db.db('rparchive');
});



//On Ready!
client.on("ready", () => {
	console.log("I am ready!");
    client.user.setPresence({ status: 'online', game: { name: 'Making History' } });
    fetchProtectedChannels();
});

//On Message!
client.on("message", (message) => {

//Look at all messages except ones that come from the bot itself 
if(message.author.username != "Grand Archist Corey")
    { 
        //Check if message is invoking a command
        if (message.content.substring(0,1) == '$') {
            //Split out arguments into an array
            const args = message.content.slice(message.length).split(' ');
            const command = args.shift().toLowerCase();
            if(command === '$bind')
            {
                if(searchProtectedChannelsForID(message.channel.id) == false)
                {
                    protectedChannels.push({_id: '0', protectedChannel: message.channel.id, name: message.channel.name});
                    updateBindedChannels(message.channel);
                    createChannelCollection(message.channel);
                    message.channel.send("This channel is now activly being achived. Oh I can already smell the history being made...");
                } 
                else
                {
                    console.log("Channel is already being protected!");
                }
            }
            //Debug command to show data
            else if(command === '$show')
            {
                console.log(protectedChannels); 
                //console.log(message.channel.name);
            }
        }
        else
        {
            var collectionName = searchProtectedChannelsForName(message.channel.id);
            if(!(typeof collectionName === 'undefined'))
            {
                if(message.content != "")
                    archiveMessage(message, collectionName);
            }
        }
    }	
});


function archiveMessage(message, collection)
{
    myobj = {author: message.author.username, authorID: message.author.id, messageContent: message.content};
    dbo.collection(collection).insertOne(myobj, function(err, res){
        if(err) throw err;
        console.log("Archived message!");
    });
}

function searchProtectedChannelsForID(key)
{
    for(var i=0; i<protectedChannels.length; i++)
    {
        if(protectedChannels[i].protectedChannel === key)
        {
            return true;
        }
    }
    return false;
}

//Search protected channels array for channel name based on channelID - This is to prevent issues if a channel is renamed.
function searchProtectedChannelsForName(key)
{
    for(var i=0; i<protectedChannels.length; i++)
    {
        if(protectedChannels[i].protectedChannel === key)
        {
            return protectedChannels[i].channelName;
        }
    }
}

//Create new collection for a newly protected channel
function createChannelCollection(channel)
{
    console.log("Creating new collection...")
    dbo.createCollection(channel.name, function (err, res){
        if(err) throw err;
        console.log("Collection created!");
    });
}

//Update DB with newly protected channel
function updateBindedChannels(channel)
{
    myobj = {protectedChannel: channel.id, channelName: channel.name};
    dbo.collection("BindedChannels").insertOne(myobj, function(err, res){
        if(err) throw err;
        console.log("Updated DB with new protected channel!");
    });
}

//Pull protected channels from DB
function fetchProtectedChannels()
{
    console.log("Fetching protected channels...");
    dbo.collection("BindedChannels").find({}).toArray(function(err, result) {
        if (err) throw err;
        protectedChannels = result;
        console.log("Channels fetched!");
    });
}

client.login(auth.token);