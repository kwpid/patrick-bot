module.exports = {
    name: 'pong',
    description: 'Returns the bot\'s latency',
    execute(message, client) {
        const ping = client.ws.ping;
        message.reply(`🏓 Pong! Latency is ${ping}ms.`);
    }
}; 