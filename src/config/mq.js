require('dotenv').config();

module.exports = {
  url: process.env.MQ_URL,
  port: process.env.MQ_PORT || 5672,
  interval: process.env.MQ_INTERVAL,
  publisher: process.env.MQ_PUBLISHER,
  consumer: process.env.MQ_CONSUMER
};
