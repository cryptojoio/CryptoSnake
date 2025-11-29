import React from 'react';
import { CoinType } from './types';

export const GRID_SIZE = 20;
export const INITIAL_SPEED = 220; 
export const SPEED_INCREMENT = 5; 
export const MIN_SPEED = 60; 

// --- ASSETS ---

export const COINS: CoinType[] = [
  {
    symbol: 'ETH',
    color: '#627EEA',
    svg: (
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="currentColor">
        <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm7.994-15.781L16.498 4 9 16.22l7.498 4.353 7.496-4.354zM24 17.616l-7.502 4.351L9 17.617l7.498 10.378L24 17.616z" />
      </svg>
    ),
  },
  {
    symbol: 'DOGE',
    color: '#C2A633',
    svg: (
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="currentColor">
        <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm4.063-20.938c-1.313 0-2.063.125-2.063.125v13.5s.813.25 2.125.25c4.688 0 7-3.25 7-6.938 0-3.625-2.375-6.937-7.063-6.937zm-4.688.125h-4.25v13.5h4.25V11.187z" />
      </svg>
    ),
  },
  {
    symbol: 'SOL',
    color: '#9945FF',
    svg: (
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="currentColor">
         <path d="M4.625 9.125L8.563 5.5h18.812l-3.938 3.625H4.625zm0 13.75l3.938-3.625h18.812l-3.938 3.625H4.625zm18.812-10.313l-3.937 3.625H4.625l3.938-3.625h18.812z" />
      </svg>
    ),
  },
  {
    symbol: 'USDT',
    color: '#26A17B',
    svg: (
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="currentColor">
        <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm2.366-18.428V11.52h4.742V8.406H8.89v3.113h4.743v2.053c-3.692.176-6.417 1.341-6.417 2.715 0 1.54 3.442 2.79 7.683 2.79V24.5h2.2v-5.422c4.241 0 7.683-1.25 7.683-2.79 0-1.374-2.725-2.54-6.417-2.716z" />
      </svg>
    ),
  }
];

export const BTC_ICON = (
  <svg viewBox="0 0 32 32" className="w-full h-full text-orange-500" fill="currentColor">
    <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm11.313-11.5c.563-3.75-2.313-5.188-4.938-5.75V11h-2.188V7.25h-3.5V11h-3.5V7.25h-3.5V11H6v3.5h3.5v10H6v3.5h3.687V32h3.5v-4h3.5v4h3.5v-4.25c5.938.375 10.438-2.375 10.125-7.25zM15.5 15.25h3.25c2.063 0 2.25 1.5.125 1.5H15.5v-1.5zm.063 7.75v-1.75h4.625c2.188 0 2.188 1.75 0 1.75H15.562z" />
  </svg>
);
