const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false,
  appInfo: {
    name: 'JoinSpot',
    version: '1.0.0'
  },
  telemetry: false,
  maxNetworkRetries: 2
});

// Ajouter les cartes de test pour une utilisation directe
const TEST_CARDS = {
  success: 'pm_card_visa', // Carte qui réussit toujours
  decline: 'pm_card_visa_chargeDeclined', // Carte qui échoue toujours
  insufficient_funds: 'pm_card_visa_insufficientFunds', // Carte avec fonds insuffisants
  authentication_required: 'pm_card_authenticationRequired' // Carte nécessitant une authentification
};

module.exports = { stripe, TEST_CARDS };