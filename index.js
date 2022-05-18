const toxicity = require('@tensorflow-models/toxicity');

const fs = require('node:fs');
const { Client, Collection, Intents,MessageEmbed } = require('discord.js');
//const { token } = require('./config.json');

const client = new Client({ 
	intents: [Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES,
] });

// The minimum prediction confidence.
const threshold = 0.9;
let model;

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});


client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once('ready', async() => {
	model = await toxicity.load(threshold);
	console.log('Ready!');
});


client.on("messageCreate", async msg => {
	var pred = [];
	if (msg.author.bot) { return; }
	else{
		text = msg.content;
		let predictions = await model.classify(text);
		predictions.forEach(prediction => {
			if(prediction.results[0].match){
				// channel.messages.cache.delete(message.id);
				pred.push(prediction.label);
			}
		});
		var text_display = "";
            if(pred.length != 1 && pred.length >0){
            for(let i=0; i<pred.length-1;i++){
                text_display += pred[i].charAt(0).toUpperCase() + pred[i].slice(1) + " and ";
            }
            text_display += pred[pred.length-1].charAt(0).toUpperCase() + pred[pred.length-1].slice(1);
          	}else if(pred.length == 1){
            	text_display = pred[0].charAt(0).toUpperCase() + pred[0].slice(1);
          	}
			if (pred.length !=0){
				msg.channel.send(`Deleted message from <@${msg.author.id}> as ${text_display} was detected in the message! Please adhere to community guidelines`);
				msg.delete()
  				.then(msg => console.log(`Deleted message from ${msg.author.username}`))
  				.catch(console.error);
			}
	   }// with mention
});
   
	

client.login(process.env.DISCORD_TOKEN);