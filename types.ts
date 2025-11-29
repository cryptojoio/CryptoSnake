import React from 'react';

export type Point = {
  x: number;
  y: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  SAVING = 'SAVING',
  LEADERBOARD = 'LEADERBOARD'
}

export interface ScoreRecord {
  id: string;
  score: number;
  timestamp: number;
}

export interface CoinType {
  symbol: string;
  color: string;
  svg: React.ReactNode;
}