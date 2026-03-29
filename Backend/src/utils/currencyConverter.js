const axios = require('axios');

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const rate = response.data.rates[toCurrency];
    return amount * rate;
  } catch (error) {
    console.error("Currency conversion failed", error);
    return amount; // Fallback to original if API fails
  }
};

module.exports = { convertCurrency };