const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'JoinSpot',
    version: '1.0.0',
  },
  telemetry: false,
  maxNetworkRetries: 2,
});

module.exports = { stripe };