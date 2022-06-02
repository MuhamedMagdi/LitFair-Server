const mq = require('../../utils/mq');
const mqConfig = require('../../config/mq');

setInterval(async () => {
    const data = await mq.consume(mqConfig.consumer);
    // add the logic for saving the results
    console.log(data);
}, mqConfig.interval);