const axios = require('axios');
require('dotenv').config();

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://www.alphavantage.co/query';

async function fetchAlphaVantageData(functionName, symbol, params = {}) {
  const queryParams = {
    function: functionName,
    symbol,
    apikey: ALPHA_VANTAGE_API_KEY,
    ...params,
  };

  if (functionName === 'TIME_SERIES_DAILY') {
    queryParams.outputsize = 'compact';
  } else if (functionName === 'RSI') {
    queryParams.interval = params.interval || 'daily';
    queryParams.time_period = params.time_period || 14;
    queryParams.series_type = 'close';
  } else if (functionName === 'MACD') {
    queryParams.interval = params.interval || 'daily';
    queryParams.series_type = 'close';
    queryParams.fastperiod = 12;
    queryParams.slowperiod = 26;
    queryParams.signalperiod = 9;
  }

  try {
    const response = await axios.get(BASE_URL, { params: queryParams });
    const data = response.data;

    if (data['Error Message']) {
      throw { status: 400, message: data['Error Message'] };
    }
    if (data['Note']) {
      throw { status: 429, message: 'Alpha Vantage rate limit exceeded' };
    }

    return data;
  } catch (error) {
    throw error.response ? { status: error.response.status, message: error.response.data } : error;
  }
}

module.exports = { fetchAlphaVantageData };