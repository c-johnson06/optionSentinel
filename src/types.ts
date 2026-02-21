export interface OptionsTrade {
    id: string;
    ticker: string;
    strike: number;
    volume: number;
    expiration: string;
    cost: number;
    type: "Call" | "Put"
    sentiment: "Bullish" | "Bearish"
}

export interface OptionContract {
    symbol: string;
    description: string;
    exch: string;
    type: string; // usually 'option'
    last: number | null;
    change: number | null;
    volume: number;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    bid: number | null;
    ask: number | null;
    underlying: string;
    strike: number;
    change_percentage: number | null;
    average_volume: number;
    last_volume: number;
    trade_date: number;
    prevclose: number | null;
    week_52_high: number;
    week_52_low: number;
    bidsize: number;
    bidexch: string;
    bid_date: number;
    asksize: number;
    askexch: string;
    ask_date: number;
    open_interest: number;
    contract_size: number;
    expiration_date: string;
    expiration_type: string;
    option_type: "call" | "put";
    root_symbol: string;
    greeks?: {
        delta: number;
        gamma: number;
        theta: number;
        vega: number;
        rho: number;
        phi: number;
        bid_iv: number;
        mid_iv: number;
        ask_iv: number;
        smirking_iv: number;
        updated_at: string;
    }
}