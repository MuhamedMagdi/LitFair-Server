const amqp = require('amqplib');
const mqConfig = require('../config/mq');

let connection = null;

connect = async () => {
    try{
        connection = await amqp.connect(mqConfig.url);
        console.log('[AMQP] connected');
    }
    catch (err) {
        console.log(`[AMQP] ${err}`);
    }
}

exports.publish = async (queueName, data) => {
    if(connection === null) {
        await connect();
    }
    const channel = await connection.createConfirmChannel();
    await channel.assertQueue(queueName);
    await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)))
    await channel.close();
}

exports.consume = async (queueName) => {
    if(connection === null) {
        await connect();
    }
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName);
    const interviewResult = []
    await channel.consume(queueName, message => {
        const interview = JSON.parse(message.content.toString());
        interviewResult.push(interview);
        channel.ack(message);
    });
    await channel.close();
    return interviewResult
}
