import { ReactElement } from "react";

export interface Card {
    name: string;
    rarity: string;
    type_text: string;
    type: string;
    subtypes: string[];
    rules_text: string;
    cost: number;
    attack: number;
    defence: number;
    life: number;
    thresholds: Thresholds;
    flavour_text: string;
    sets: string[];
}

export interface Guess {
    card: Card;
    resultTexts: (string | ReactElement)[];
    resultStyles: string[];
}

export interface Rarity {
    name: string;
    rank: number;
}

export interface Thresholds {
    air: number;
    earth: number;
    fire: number;
    water: number;
}
