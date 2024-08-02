import React, { ChangeEvent, KeyboardEvent, ReactElement, useEffect, useState } from 'react'
import cardsJson from './data/sorcerycards.json'
import airThresLogoFile from './data/airthres.png'
import earthThresLogoFile from './data/earththres.png'
import fireThresLogoFile from './data/firethres.png'
import waterThresLogoFile from './data/waterthres.png'
import './App.css'
import { jsx } from 'react/jsx-runtime'

const startsWith = (a:string, b:string) => a.toLowerCase().startsWith(b.toLowerCase());
const compareStrings = (a:string, b:string) => a.toLowerCase() === b.toLowerCase();
const substring = (a:string, b:string) => a.toLowerCase().includes(b.toLowerCase());

function replaceAll(str: string, find: string, replace: string) {
  function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

const zip = (a: any[], b: any[]) => a.map((elem, i) => [elem, b[i]]);

const simpleHash = (str: string):number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return (hash >>> 0)
};

interface Rarity{
  name: string,
  rank: number

}

const isRarity = (object: any) : object is Rarity => "rank" in object;  

const isThresholds = (object: any): object is Thresholds => "air" in object && "fire" in object;

const stringToRarity = (str: string): Rarity => {
  switch (str) {
    case "Ordinary":
      return {name: str, rank: 0}
    case "Exceptional":
      return {name: str, rank: 1}
    case "Elite":
      return {name: str, rank: 2}
    case "Unique":
      return {name: str, rank: 3}
    default:
      return {name: "None", rank: -1}
  }
};

const getListOfKeywords = (card: Card): string[] => {
  return cardKeywords.filter( (keyword) => card.rules_text.toLowerCase().includes(keyword.toLowerCase()));
};

interface Thresholds{
  air: number,
  earth: number,
  fire: number,
  water: number
}

interface Card {
  card_name: string;
  rarity: string;
  type_text: string;
  type: string;
  subtype: string;
  rules_text: string;
  cost: number,
  attack: number,
  life: number,
  thresholds: Thresholds
};

const cardsToArray = (card: Card): any[] =>{
  return [
    card.card_name,
    card.cost,
    card.attack,
    stringToRarity(card.rarity),
    card.life,
    card.subtype === "" ? [card.type] : [card.type, card.subtype],
    getListOfKeywords(card),
    card.thresholds
    // card.thresholds.air,
    // card.thresholds.earth,
    // card.thresholds.fire,
    // card.thresholds.water
   ];
}

const attributeDisplayNames = [
  "Name",
  "Cost",
  "Power",
  "Rarity",
  "Life",
  "Type(s)",
  "Keywords",
  // "Air Thres.",
  // "Earth Thres.",
  // "Fire Thres.",
  "Water Thres.",
]

const cardKeywords = [
  "Airborne",
  "Burrow",
  "Genesis",
  "Charge",
  "Immobile",
  "Disable",
  "Lethal",
  "Movement",
  "Ranged",
  "Spellcaster",
  "Stealth",
  "Submerge",
  "Voidwalk",
  "Landbound",
  "Waterbound",
  "Deathrite",
  "Flood",
  "Projectile"
]

interface Guess {
  card: Card,
  resultTexts: (string | ReactElement)[],
  resultStyles: string[]
}

interface ThresholdsDisplayProp {
  thresholds: Thresholds
}


const fireThresLogo = (<img src={fireThresLogoFile} className='threslogo'/>);
const earthThresLogo = (<img src={earthThresLogoFile} className='threslogo'/>);
const airThresLogo = (<img src={airThresLogoFile} className='threslogo'/>);
const waterThresLogo = (<img src={waterThresLogoFile} className='threslogo'/>);

const thresholdAsList = (thresholds: Thresholds) : string[] => {
  return Array(thresholds.air).fill("A")
    .concat(Array(thresholds.earth).fill("E")
    .concat(Array(thresholds.fire).fill("F")
    .concat(Array(thresholds.water).fill("W"))));
}

const thresCharToLogoMap = {
  "A": airThresLogo,
  "E": earthThresLogo,
  "F": fireThresLogo,
  "W": waterThresLogo,
}

function App() {

  const GUESSES_UNTIL_HINT = 7;

  const [cardsData, setCardsData] = useState<Card[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [suggestions, setSuggestions] = useState<Card[]>([]);
  const [targetCard, setTargetCard] = useState<Card>();
  const [gameWon, setGameWon] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [todayDate, setTodayDate] = useState("");

  function RulesText(){
    
    const revealHint = () => {
      setHintRevealed(true);
    }

    const rulesNotRevealedMessage = (<p>Rules text revealed in {GUESSES_UNTIL_HINT - guesses.length} guess(es)</p>);
    const rulesHintMessage = (<p>{rulesTextHint()}</p>);
    const revealHintButton = (<button onClick= {revealHint}>Reveal Hint</button>);
    
    if(!canRevealHint()){
      return rulesNotRevealedMessage;
    }
    if(hintRevealed){
      return rulesHintMessage;
    }
    if(!hintRevealed  && canRevealHint()){
      return revealHintButton;
    }
    return <p>wtf bro</p>
  }
  
  
  function getDailyCard():Card {
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = today.getMonth().toString();
    const date = today.getDate().toString();
    const hashed_index = simpleHash(`${year}/${month}/${date}withicons`) % cardsJson.length;
    return cardsJson[hashed_index];
  }

  useEffect(() => {
    setCardsData(cardsJson);
    setTargetCard(getDailyCard());
    setTodayDate(new Date().toDateString());
  }, []);
  
  useEffect(() => {

  }, [currentAnswer]);
  
  const handleGuessInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCurrentAnswer(value);
    
    if (value.length >= 3) {
      const filteredSuggestions = cardsData
        .filter(card => substring(card.card_name, value))
        .slice(0, 10);
      setSuggestions(filteredSuggestions);
    }else{
      setSuggestions([]);
    }
  };


  const handleSubmit = (e: { preventDefault: () => void; }):void => {
    e.preventDefault();
    const guessedCard = cardsData.find( (card) => compareStrings(card.card_name, currentAnswer));
    // console.log(guessedCountry);
    if(guessedCard === undefined){
      return;
    }
    if(!guesses.some( (guess) => guess.card.card_name === guessedCard.card_name)){
      const currentGuess: Guess = {
        card: guessedCard,
        resultTexts: [],
        resultStyles: []
      };
      if(targetCard !== undefined){
        setGuessResults(currentGuess, guessedCard, targetCard);
        setGuesses([currentGuess, ...guesses]);
        if(targetCard.card_name === guessedCard.card_name){
          setGameWon(true);
        }
      }
    }
    setCurrentAnswer("");
  };
  
  const setGuessResults = (currentGuess: Guess, guessedCard: Card, targetCard: Card): void => {
    zip(cardsToArray(guessedCard), cardsToArray(targetCard)).forEach((valuePair, index) => {
      const guessedValue = valuePair[0];
      const targetValue = valuePair[1];

      console.log(`${index} - ${guessedValue} vs ${targetValue}`)
      if(typeof guessedValue === 'number' && typeof targetValue === 'number'){
        console.log("number - " + index)
        let emoji = "";
        let style = "right";
        if(guessedValue < targetValue){
          if(guessedValue >= 0){
            emoji = " ⬆️";
          }
          style = "wrong";
        }else if(guessedValue > targetValue){
          if(targetValue >= 0){
            emoji = " ⬇️";
          }
          style = "wrong";
        }
        if(guessedValue < 0){
          currentGuess.resultTexts.push(`-`);
        }else{
          currentGuess.resultTexts.push(`${guessedValue}${emoji}`);
        }
          currentGuess.resultStyles.push(style);
      }
      else if(typeof guessedValue === 'string' && typeof targetValue === 'string'){
        let style = "wrong";
        if(guessedValue == targetValue){
          style = "right";
        }
        currentGuess.resultStyles.push(style);
        currentGuess.resultTexts.push(`${guessedValue}`);
      }else if (guessedValue instanceof Array && targetValue instanceof Array) {
        let style = "wrong";
        if(guessedValue.length == targetValue.length){
          if(guessedValue.sort().join(",") === targetValue.sort().join(",")){
            style = "right";
          }
        }
        if(style !== "right"){
          if(targetValue.some((elem) => guessedValue.includes(elem))){
            style = "partial";
          }
        }
        currentGuess.resultTexts.push(`${guessedValue.join(", ")}`);
        currentGuess.resultStyles.push(style);
      }else if (isThresholds(guessedValue) && isThresholds(targetValue)){
        let style = "wrong";
        const guessedList = thresholdAsList(guessedValue);
        const targetList = thresholdAsList(targetValue);
        if(guessedList.length == targetList.length){
          if(guessedList.sort().join(",") === targetList.sort().join(",")){
            style = "right";
          }
        }
        if(style !== "right"){
          if(targetList.some((elem) => guessedList.includes(elem))){
            style = "partial";
          }
        }
        currentGuess.resultTexts.push(
          <>{guessedList.map((element) => thresCharToLogoMap[element])}</>
        );
        currentGuess.resultStyles.push(style);
      }else if (isRarity(guessedValue) && isRarity(targetValue)){
        console.log("we have rarity!");
        console.log(guessedValue);
        console.log(targetValue);
        let style = "right";
        let emoji = "";
        if(guessedValue.rank < targetValue.rank){
          if(guessedValue.rank >= 0){
            emoji = " ⬆️";
          }
          style = "wrong";
        }
        if(guessedValue.rank > targetValue.rank){
          if(targetValue.rank >= 0){
            emoji = " ⬇️";
          }
          style = "wrong";
        }
        if(guessedValue.rank < 0){
          currentGuess.resultTexts.push(`-`);
        }else{
          currentGuess.resultTexts.push(`${guessedValue.name}${emoji}`);
        }
          currentGuess.resultStyles.push(style);

      }else{
        currentGuess.resultTexts.push(guessedValue);
        currentGuess.resultStyles.push("none");
      }
    }
    );
  }

  const canRevealHint = () => guesses.length >= GUESSES_UNTIL_HINT;
  
  const rulesTextHint = (): string => {
    if(targetCard){
      return "HINT: " + replaceAll(targetCard.rules_text, targetCard.card_name, "■".repeat(targetCard.card_name.length))
    }
    return "No hint for today..."
  }

  const copyShareToClipboard = () => {
    const link = "www.google.com";
    const emojiMatrix = guesses.map( (guess) => {
    return guess.resultStyles.map(
      (style) => {
        switch (style) {
          case "wrong":
            return "🟥";
          case "partial":
            return "🟨";
          case "right":
            return "🟩";
          default:
            return "?";
        }
      }
    ).join("");
  }).join("\n");
    console.log(guesses[0].resultStyles);
    console.log(emojiMatrix);
    navigator.clipboard.writeText(`Sorcerdle - ${todayDate} (${guesses.length} Guesses${hintRevealed? " + Hint" : ""})\n${link}\n${emojiMatrix}`);
  };
  const winDisplay = (
    <span className='win-container'>
      <p>🥳🎉You Won!!!💯🎊</p>
      <button onClick={copyShareToClipboard}>Share</button>
    </span>
    );

  return (
    <div className='game'>
      <h1>Sorcerdle</h1>
      <form className='input-container'>
      <input
        className='guess-input'
        type="text"
        value={currentAnswer}
        onChange={handleGuessInputChange}
        list='suggestions'
        />
      <button onClick={handleSubmit}>Submit</button>
      {suggestions.length > 0 && (
        <datalist id='suggestions'>
          {suggestions.map((suggestions, index) => (
            <option value={suggestions.card_name}>{suggestions.card_name}</option>
          ))}
        </datalist>
      )}
      </form>
      {/* <p>{rulesTextHint()}</p> */}
      <span className='rules-container'>
        <RulesText/>
      </span>
      {gameWon && winDisplay}
      <div className='table-container'>
      <table className='guesses-table'>
        <thead>
        <tr>{attributeDisplayNames.map( (attribute, index) => (
          <th key={index}>{attribute}</th>
        ))}
        </tr>
        </thead>
        <tbody>
        {guesses.map( (guess, index) => (
          <tr key={index}>
          {zip(guess.resultTexts, guess.resultStyles).map((textStylePair, index) => (
            <td className={`result-${textStylePair[1]}`}>{textStylePair[0]}</td>
          ))}
          </tr>
        ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default App