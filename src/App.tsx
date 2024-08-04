import { ReactElement, useEffect, useState } from 'react'
import cardsJson from './data/sorcerycards.json'
import airThresLogoFile from './data/airthres.png'
import earthThresLogoFile from './data/earththres.png'
import fireThresLogoFile from './data/firethres.png'
import waterThresLogoFile from './data/waterthres.png'
import './App.css'
import Select from 'react-select';

// const startsWith = (a:string, b:string) => a.toLowerCase().startsWith(b.toLowerCase());
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
  "Threshold",
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


const thresholdAsList = (thresholds: Thresholds) : string[] => {
  return Array(thresholds.air).fill("A")
    .concat(Array(thresholds.earth).fill("E")
    .concat(Array(thresholds.fire).fill("F")
    .concat(Array(thresholds.water).fill("W"))));
}

const thresCharToLogoMap =  (char: string, index: number): JSX.Element => {

  switch (char){
    case "A":
      return (<img key={index} src={airThresLogoFile} className='threslogo' />);
    case "E":
      return (<img key={index} src={earthThresLogoFile} className='threslogo' />);
    case "F":
      return (<img key={index} src={fireThresLogoFile} className='threslogo' />);   
    case "W":
      return (<img key={index} src={waterThresLogoFile} className='threslogo' />);
    default:
      return <></>;
  }
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
  const [showingSuggestionMenu, setShowingSuggestionMenu] = useState(false);
  const [shared, setShared] = useState(false);

  const [debugText, setDebugText] = useState("");

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
    console.log("ANSWER CHANGED!!!");
    console.log("->> " + currentAnswer);
  }, [currentAnswer]);
  
  const handleGuessInputChange = (value: string) => {
    if(!showingSuggestionMenu){
      return;
    }
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

    setDebugText(currentAnswer);

    console.log("HANDLEING SUBMIT!!!");
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
          <>{guessedList.map((element, index) => thresCharToLogoMap(element, index))}</>
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
    setShared(true);
    const link = "https://sorcerdle.com/";
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
      <button onClick={copyShareToClipboard}>{shared? "Copied": "Share"}</button>
    </span>
    );

  return (
    <div className='game'>
      <h1>Sorcerdle!</h1>
      <span className='input-container'>
      
      <Select className='guess-input' 
        options={suggestions.map((suggestion) => {
          return {value: suggestion.card_name, label: suggestion.card_name}
        })}
        onInputChange={handleGuessInputChange}
        onChange={(newValue) =>  showingSuggestionMenu ? setCurrentAnswer(newValue ? newValue.value : "") : null}
        onMenuOpen={() => setShowingSuggestionMenu(true)}
        onMenuClose={() => setShowingSuggestionMenu(false)}
        // inputValue={currentAnswer}
      />
      
      {/* <input
        className='guess-input'
        type="text"
        value={currentAnswer}
        onChange={handleGuessInputChange}
        list='suggestions'
        /> */}
      {/* {suggestions.length > 0 && (
        <datalist id='suggestions'>
        {suggestions.map((suggestions) => (
          <option value={suggestions.card_name}>{suggestions.card_name}</option>
          ))}
          </datalist>
          )} */}
      {/*suggestions.length > 0 && (
        <table className='suggestions-container'>
          {suggestions.map((suggestion) => (
            <tr>{suggestion.card_name}</tr>
          ))}
        </table>
      )*/}
      <button onClick={handleSubmit}>Submit{debugText}</button>
      </span>
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
            <td key={index} className={`result-${textStylePair[1]}`}>{textStylePair[0]}</td>
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