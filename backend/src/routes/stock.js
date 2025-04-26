const express = require('express');
const cache = require('memory-cache');
const { fetchAlphaVantageData } = require('../utils/alphaVantage');

const router = express.Router();

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// OHLC endpoint
router.get('/:symbol/ohlc', async (req, res) => {
  const { symbol } = req.params;
  try {
    const cacheKey = `ohlc_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await fetchAlphaVantageData('TIME_SERIES_DAILY', symbol);
    const timeSeries = data['Time Series (Daily)'] || {};
    const result = Object.entries(timeSeries).map(([date, values]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
    }));

    cache.put(cacheKey, result, CACHE_DURATION);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// RSI endpoint
router.get('/:symbol/rsi', async (req, res) => {
  const { symbol } = req.params;
  const timePeriod = parseInt(req.query.time_period) || 14;
  try {
    const cacheKey = `rsi_${symbol}_${timePeriod}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await fetchAlphaVantageData('RSI', symbol, { time_period: timePeriod });
    const timeSeries = data['Technical Analysis: RSI'] || {};
    const result = Object.entries(timeSeries).map(([date, values]) => ({
      date,
      rsi: parseFloat(values['RSI']),
    }));

    cache.put(cacheKey, result, CACHE_DURATION);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// MACD endpoint
router.get('/:symbol/macd', async (req, res) => {
  const { symbol } = req.params;
  try {
    const cacheKey = `macd_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await fetchAlphaVantageData('MACD', symbol);
    const timeSeries = data['Technical Analysis: MACD'] || {};
    const result = Object.entries(timeSeries).map(([date, values]) => ({
      date,
      macd: parseFloat(values['MACD']),
      signal: parseFloat(values['MACD_Signal']),
      histogram: parseFloat(values['MACD_Hist']),
    }));

    cache.put(cacheKey, result, CACHE_DURATION);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Mult 2, Length 20 endpoint (2x 20-period SMA)
router.get('/:symbol/mult2', async (req, res) => {
  const { symbol } = req.params;
  try {
    const cacheKey = `mult2_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await fetchAlphaVantageData('TIME_SERIES_DAILY', symbol);
    const timeSeries = data['Time Series (Daily)'] || {};

    // Calculate SMA
    const closes = Object.entries(timeSeries)
      .map(([date, values]) => ({ date, close: parseFloat(values['4. close']) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ensure chronological order

    const result = [];
    for (let i = 19; i < closes.length; i++) {
      const window = closes.slice(i - 19, i + 1).map((d) => d.close);
      const sma = window.reduce((sum, val) => sum + val, 0) / 20;
      result.push({ date: closes[i].date, mult2: sma * 2 });
    }

    cache.put(cacheKey, result, CACHE_DURATION);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

module.exports = router;