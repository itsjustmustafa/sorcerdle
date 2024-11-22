import {ReactElement} from 'react';

export interface Card {
  card_name: string;
  rarity: string;
  type_text: string;
  type: string;
  subtype: string;
  rules_text: string;
  cost: number,
  attack: number,
  life: number,
  thresholds: Thresholds,
  flavour_text: string,
};

export interface Guess {
  card: Card,
  resultTexts: (string | ReactElement)[],
  resultStyles: string[]
};

export interface Rarity{
  name: string,
  rank: number

};

export interface Thresholds{
  air: number,
  earth: number,
  fire: number,
  water: number
};