import { ReactElement, useEffect, useState } from 'react'
import cardsJson from './data/sorcerycards.json'
import cardImageUrls from './data/card_image_urls.json'
import airThresLogoFile from './data/airthres.png'
import earthThresLogoFile from './data/earththres.png'
import fireThresLogoFile from './data/firethres.png'
import waterThresLogoFile from './data/waterthres.png'
import './App.css'
import Select from 'react-select';

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

// const isJSXElement = (object: any): object is JSX.Element => "key" in object && "props" in object && "type" in object;

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
  const kws = consolidateAlikeKeywords(cardKeywords.filter(
    (keyword) => card.rules_text.toLowerCase().includes(keyword.toLowerCase())).sort(
      (keywordA, keywordB) => {
        const indexB = card.rules_text.toLowerCase().indexOf(keywordB.toLowerCase());
        const indexA = card.rules_text.toLowerCase().indexOf(keywordA.toLowerCase());
        return indexA - indexB;
      }
    ));
  return kws;
};

function isFirstInstance<T>(value: T, index: number, array: T[]){
  return array.indexOf(value) === index;
}

const consolidateAlikeKeywords = (keywords: string[]) : string[] =>{
  return keywords.map((value) => {
    switch (value){
      case "Carries":
      case "Carried":
        return "Carry"
      default:
        return value;
    }
  }).filter((value, index, array) => isFirstInstance(value, index, array));
}

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
  thresholds: Thresholds,
  flavour_text: string,
};

const NONE_CARD: Card = {
  card_name: '',
  rarity: '',
  type_text: '',
  type: '',
  subtype: '',
  rules_text: '',
  cost: 0,
  attack: 0,
  life: 0,
  thresholds: {
    air: 0,
    earth: 0,
    fire: 0,
    water: 0
  },
  flavour_text: ''
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
  "Projectile",
  "(F)",
  "(E)",
  "(A)",
  "(W)",
  "Carry",
  "Carries",
  "Carried",
  "Nearby",
  "Adjacent",
  "Target",
  "Draw",
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

const thresCharToLogoMap =  (char: string, index: number, styling={}): JSX.Element => {

  switch (char){
    case "A":
      return (<img key={index} src={airThresLogoFile} className='threslogo' style={styling} />);
    case "E":
      return (<img key={index} src={earthThresLogoFile} className='threslogo' style={styling} />);
    case "F":
      return (<img key={index} src={fireThresLogoFile} className='threslogo' style={styling} />);   
    case "W":
      return (<img key={index} src={waterThresLogoFile} className='threslogo' style={styling} />);
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
  const [previewedCard, setPreviewedCard] = useState<Card>(NONE_CARD);


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
  
  function getCardByName(card_name: string): Card{
    const foundCard = cardsJson.find((card) => card.card_name === card_name);
    if (foundCard !== undefined){
      return foundCard;
    }
    return NONE_CARD;
  }
  
  function getDailyCard():Card {

    const today = new Date();
    const year = today.getFullYear().toString();
    const month = today.getMonth().toString();
    const date = today.getDate().toString();
    const isAprilFools = (month === "3") && (date === "1");
    if(isAprilFools){
      const craigCard = getCardByName("Craig Sumison");
      if(craigCard.card_name !== ''){
        return craigCard;
      }
    }
    let hashExtension = "";
    for(let i = 0; i < 10; i++){
      const hashed_index = simpleHash(`${year}/${month}/${date}${hashExtension}extrarandomtext`) % cardsJson.length;
      const todaysCard = cardsJson[hashed_index];
      if(todaysCard.card_name === "Craig Sumison"){
        hashExtension += "!";
      }else{
        return todaysCard;
      }
    }
    
    const hashed_index = simpleHash(`${year}/${month}/${date}NotCraig`) % cardsJson.length;
    return cardsJson[hashed_index];
  }

  useEffect(() => {
    setCardsData(cardsJson);
    setTargetCard(getDailyCard());
    setTodayDate(new Date().toDateString());
  }, []);
  
  useEffect(() => {
  }, [currentAnswer]);
  
  const handleGuessInputChange = (value: string) => {
    if(!showingSuggestionMenu){
      return;
    }
    
    if(value !== ""){
      setCurrentAnswer(value);
    }
    
    if (value.length > 0) {
      const filteredSuggestions = cardsData.map( card => {
        if(startsWith(card.card_name, value)){
          return ({card: card, score: 2});
        }
        if(substring(card.card_name, value)){
          return ({card: card, score: 1});
        }
        return ({card:card, score:0});
      }).sort((a, b) => b.score < a.score ? -1 : (b.score > a.score ? 1 : b.card.card_name < a.card.card_name ? 1 : -1)).slice().filter(pair => pair.score > 0 ).map(pair => pair.card)

      setSuggestions(filteredSuggestions);
    }else{
      setSuggestions([]);
    }
  };

  const preloadCardImage = (card_name: string): void => {
    const image_url = getCardImageUrl(card_name);
    const img = new Image();
    img.src = image_url;
  }

  const handleSubmit = (e: { preventDefault: () => void; }):void => {
    e.preventDefault();

    // try to find a card that matches what the user has submitted
    const guessedCard = cardsData.find( (card) => compareStrings(card.card_name, currentAnswer));
    if(guessedCard === undefined){
      return;
    }
    // Check if you haven't already guessed the card
    if(!guesses.some( (guess) => guess.card.card_name === guessedCard.card_name)){
      const currentGuess: Guess = {
        card: guessedCard,
        resultTexts: [],
        resultStyles: []
      };
      if(targetCard !== undefined){
        // Its a new guess, so add it to the guesses list and preload the card image
        preloadCardImage(guessedCard.card_name);
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
    zip(cardsToArray(guessedCard), cardsToArray(targetCard)).forEach((valuePair) => {
      const guessedValue = valuePair[0];
      const targetValue = valuePair[1];

      if(typeof guessedValue === 'number' && typeof targetValue === 'number'){
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
          }else{
            emoji = " 🚫"
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
        // currentGuess.resultTexts.push(`${guessedValue.join(", ")}`);
        currentGuess.resultTexts.push( <>
          {guessedValue.map( (elem) => {
            if(typeof elem == "string"){
              switch(elem){
                case "(A)":
                  return thresCharToLogoMap("A", 0, {"width": "1em"});
                case "(E)":
                  return thresCharToLogoMap("E", 0, {"width": "1em"});
                case "(F)":
                  return thresCharToLogoMap("F", 0, {"width": "1em"});
                case "(W)":
                  return thresCharToLogoMap("W", 0, {"width": "1em"});
                default:
                  return <>{elem}</>;
              }
            }
          }).reduce((acc, x) => acc === undefined ? x : <>{acc}{", "}{x}</>, undefined)}
          </>
        );
        currentGuess.resultStyles.push(style);
      }else if (isThresholds(guessedValue) && isThresholds(targetValue)){
        let style = "wrong";
        const guessedList = thresholdAsList(guessedValue);
        const targetList = thresholdAsList(targetValue);
        if(guessedList.length == targetList.length){
          if(guessedList.sort().slice().join(",") === targetList.sort().slice().join(",")){
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
    });
  }

  const getCardImageUrl = (cardName: string): string => {
    const card_url = cardImageUrls.find((override) => override.name === cardName);
    if(card_url !== undefined){
      return card_url.url;
    }
    return "";
  };
  const canRevealHint = () => guesses.length >= GUESSES_UNTIL_HINT;
  
  const rulesTextHint = (): string => {
    if(targetCard){
      let hintText;
      if(targetCard.rules_text !== ""){
        hintText = replaceAll(targetCard.rules_text, targetCard.card_name, "■".repeat(targetCard.card_name.length));
      }else if (targetCard.flavour_text !== ""){
        hintText = replaceAll(targetCard.flavour_text, targetCard.card_name, "■".repeat(targetCard.card_name.length));
      }else{
        hintText = targetCard.type_text;
      }
      return "Hint: " + hintText;
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
    navigator.clipboard.writeText(`Sorcerdle - ${todayDate} (${guesses.length} Guesses${hintRevealed? " + Hint" : ""})\n${link}\n${emojiMatrix}`);
  };
  const winDisplay = (
    <span className='win-container'>
      <p>🥳🎉You Won!!!💯🎊</p>
      <span className='share-button-container'>
      <button onClick={copyShareToClipboard} className='share-button' >{shared? "Copied": "Share"}</button>
      <button 
        className='small-hire-me'
        onClick={() => window.open('https://www.linkedin.com/in/mustafa-xyz/', '_blank')}
      >
        <p className='rainbowText'><i>Hire Me! Pls</i></p></button>
      </span>
    </span>
    );
  
  const isItCoolTime = ():boolean => {
    const d = new Date();
    const hour = d.getHours();
    return hour == 20 || hour == 21;
  }

  return (
    <>
    <span id='link-container'>
      <a href="https://github.com/itsjustmustafa/sorcerdle#sorcerdle" target='_blank'>Source / Bug report</a>
      {/* <a href="https://www.linkedin.com/in/mustafa-xyz/" target='_blank'>Hire me pls</a> */}
    </span>
    <span id='help-link'>
      <a href="https://github.com/itsjustmustafa/sorcerdle/#how-to-play" target="_blank">How To Play</a>
    </span>
    <div className='game'>

      <h1 id='title'>Sorcerdle!</h1>
      <span className='input-container'>
      
      <Select className='guess-input' 
        options={suggestions.map((suggestion) => {
          return {value: suggestion.card_name, label: suggestion.card_name}
        })}
        onInputChange={handleGuessInputChange}
        onChange={(newValue) =>  showingSuggestionMenu ? setCurrentAnswer(newValue ? (newValue.value === "" ? "nothing" : newValue.value) : "uhoh") : null}
        onMenuOpen={() => setShowingSuggestionMenu(true)}
        onMenuClose={() => setShowingSuggestionMenu(false)}
        styles={{
          dropdownIndicator: defaultStyles => ({
            ...defaultStyles,
            'display': 'none'
          })
        }}
        placeholder={"Type a card name..."}
      />
      <button 
        onClick={handleSubmit}
        disabled={gameWon}  
      >Submit</button>
      </span>
      {!gameWon && (
        <span className='rules-container'>
          <RulesText/>
        </span>
      )}
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
          {zip(guess.resultTexts, guess.resultStyles).map((textStylePair, index:number) => (
            <>
            {index !== 0 && (
              <td key={index} className={`result-${textStylePair[1]}`}>{textStylePair[0]}</td>
            )}
            {index === 0 && (
              <td
                key={index}
                className={`result-${textStylePair[1]}`}
                onClick={() => setPreviewedCard(guess.card.card_name === previewedCard.card_name ? NONE_CARD : guess.card)}
              >
                <span className='card-name-container'>{guess.card.card_name}<br/>
                <span
                  >
                    {guess.card.card_name===previewedCard.card_name && <u>Hide</u>}
                    {guess.card.card_name!==previewedCard.card_name && <u>Show</u>}
              </span>
              <div className={'card-image-popup card-preview ' + (guess.card.type === "Site" ? " site-img" : "")}>
                {guess.card.card_name == previewedCard.card_name && <img src={getCardImageUrl(previewedCard.card_name)} alt={previewedCard.card_name}/>}
              </div>
            </span>
              </td>
            )}
            </>
          ))}
          </tr>
        ))}
        </tbody>
      </table>
      </div>
            <span className='card_image_mobile_modal'>
              {previewedCard.card_name !== "" && (
                <img
                  className={'card_image_mobile card-preview ' + (previewedCard.type === "Site" ? 'site-img' : 'nonsite-img')}
                  src={getCardImageUrl(previewedCard.card_name)}
                  alt={previewedCard.card_name}
                  onClick={() => setPreviewedCard(NONE_CARD)}
                />
              )}
            </span>
    </div>
    </>
  );
};

export default App

