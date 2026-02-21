import { OptionsTrade } from "../types";

export const MOCK_TRADES: OptionsTrade[] = [
    {
        id: "1",
        ticker: "TSLA",
        strike: 220,
        volume: 5400,
        expiration: "2026-03-20",
        cost: 1.45,
        type: "Call",
        sentiment: "Bullish"
    },
    {
        id: "2",
        ticker: "NVDA",
        strike: 145,
        volume: 12000,
        expiration: "2026-04-17",
        cost: 4.50,
        type: "Call",
        sentiment: "Bullish"
    },
    {
        id: "3",
        ticker: "AAPL",
        strike: 180,
        volume: 3500,
        expiration: "2026-03-27",
        cost: 0.75,
        type: "Put",
        sentiment: "Bearish"
    },
    {
        id: "4",
        ticker: "MSFT",
        strike: 450,
        volume: 2100,
        expiration: "2026-05-15",
        cost: 12.20,
        type: "Call",
        sentiment: "Bullish"
    },
    {
        id: "5",
        ticker: "AMD",
        strike: 160,
        volume: 8900,
        expiration: "2026-03-20",
        cost: 2.15,
        type: "Put",
        sentiment: "Bearish"
    },
    {
        id: "6",
        ticker: "COIN",
        strike: 280,
        volume: 4200,
        expiration: "2026-04-03",
        cost: 8.90,
        type: "Call",
        sentiment: "Bullish"
    },
    {
        id: "7",
        ticker: "META",
        strike: 520,
        volume: 1500,
        expiration: "2026-03-20",
        cost: 15.40,
        type: "Call",
        sentiment: "Bullish"
    },
    {
        id: "8",
        ticker: "PLTR",
        strike: 35,
        volume: 25000,
        expiration: "2026-06-19",
        cost: 0.45,
        type: "Call",
        sentiment: "Bullish"
    },
    {
        id: "9",
        ticker: "GOOGL",
        strike: 155,
        volume: 1200,
        expiration: "2026-03-20",
        cost: 2.10,
        type: "Put",
        sentiment: "Bearish"
    },
    {
        id: "10",
        ticker: "AMZN",
        strike: 190,
        volume: 5600,
        expiration: "2026-04-17",
        cost: 6.80,
        type: "Call",
        sentiment: "Bullish"
    },
    {
        id: "11",
        ticker: "NFLX",
        strike: 620,
        volume: 800,
        expiration: "2026-03-20",
        cost: 14.50,
        type: "Put",
        sentiment: "Bearish"
    },
    {
        id: "12",
        ticker: "MSTR",
        strike: 1200,
        volume: 3200,
        expiration: "2026-03-27",
        cost: 45.20,
        type: "Call",
        sentiment: "Bullish"
    }
];
