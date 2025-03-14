import { ReactElement, useEffect, useState } from "react";
import cardsJson from "./data/sorcerycards.json";
import cardImageUrls from "./data/card_image_urls.json";
import airThresLogoFile from "./data/airthres.png";
import earthThresLogoFile from "./data/earththres.png";
import fireThresLogoFile from "./data/firethres.png";
import waterThresLogoFile from "./data/waterthres.png";
import alphaLogoFile from "./data/alpha.png";
import betaLogoFile from "./data/beta.png";
import arthurialLegendsLogoFile from "./data/arthurian legends.png";
import craigLogoFile from "./data/craig.png";
import "./App.css";
import Select from "react-select";
import { Card, Thresholds, Guess, Rarity } from "./interfaces.tsx";
import {
    startsWith,
    compareStrings,
    isFirstInstance,
    replaceAll,
    simpleHash,
    substring,
    zip,
} from "./utils.tsx";

const isRarity = (object: any): object is Rarity => "rank" in object;

const isThresholds = (object: any): object is Thresholds => {
    return "air" in object && "fire" in object;
};

const stringToRarity = (str: string): Rarity => {
    switch (str) {
        case "Ordinary":
            return { name: str, rank: 0 };
        case "Exceptional":
            return { name: str, rank: 1 };
        case "Elite":
            return { name: str, rank: 2 };
        case "Unique":
            return { name: str, rank: 3 };
        default:
            return { name: "None", rank: -1 };
    }
};

const getListOfKeywords = (card: Card): string[] => {
    const kws = consolidateAlikeKeywords(
        cardKeywords
            .filter((keyword) =>
                card.rules_text.toLowerCase().includes(keyword.toLowerCase())
            )
            .sort((keywordA, keywordB) => {
                const indexB = card.rules_text
                    .toLowerCase()
                    .indexOf(keywordB.toLowerCase());
                const indexA = card.rules_text
                    .toLowerCase()
                    .indexOf(keywordA.toLowerCase());
                return indexA - indexB;
            })
    );
    return kws;
};

const consolidateAlikeKeywords = (keywords: string[]): string[] => {
    return keywords
        .map((value) => {
            switch (value) {
                case "Carries":
                case "Carried":
                    return "Carry";
                default:
                    return value;
            }
        })
        .filter((value, index, array) => isFirstInstance(value, index, array));
};

const NONE_CARD: Card = {
    name: "",
    rarity: "",
    type_text: "",
    type: "",
    subtypes: [],
    rules_text: "",
    cost: -1,
    attack: -1,
    life: -1,
    thresholds: {
        air: 0,
        earth: 0,
        fire: 0,
        water: 0,
    },
    flavour_text: "",
    defence: -1,
    sets: [],
};

const cardsToArray = (card: Card): any[] => {
    return [
        card.name,
        card.cost,
        card.attack,
        card.defence,
        stringToRarity(card.rarity),
        card.life,
        [card.type, ...card.subtypes],
        getListOfKeywords(card),
        card.thresholds,
        card.sets,
    ];
};

const attributeDisplayNames = [
    "Name",
    "Cost",
    "Attack",
    "Defence",
    "Rarity",
    "Life",
    "Type(s)",
    "Keywords",
    "Threshold",
    "Sets",
];

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
    "Lance",
];

const thresholdAsList = (thresholds: Thresholds): string[] => {
    return Array(thresholds.air)
        .fill("A")
        .concat(
            Array(thresholds.earth)
                .fill("E")
                .concat(
                    Array(thresholds.fire)
                        .fill("F")
                        .concat(Array(thresholds.water).fill("W"))
                )
        );
};

const setToLogoMap = (
    set_name: string,
    index: number,
    styling = {}
): JSX.Element => {
    let image_src = alphaLogoFile;

    if (set_name == "Alpha") {
        image_src = alphaLogoFile;
    } else if (set_name == "Beta") {
        image_src = betaLogoFile;
    } else if (set_name == "Arthurian Legends") {
        image_src = arthurialLegendsLogoFile;
    } else if (set_name == "Craig") {
        image_src = craigLogoFile;
    } else {
        return <></>;
    }
    return (
        <img
            key={index}
            src={image_src}
            className="setLogo"
            style={styling}
            alt={set_name}
            title={set_name}
        />
    );
};

const thresCharToLogoMap = (
    char: string,
    index: number,
    styling = {}
): JSX.Element => {
    let image_src = airThresLogoFile;
    let element_name = "";

    switch (char) {
        case "A":
            image_src = airThresLogoFile;
            element_name = "Air";
            break;
        case "F":
            image_src = fireThresLogoFile;
            element_name = "Fire";
            break;
        case "E":
            image_src = earthThresLogoFile;
            element_name = "Earth";
            break;
        case "W":
            image_src = waterThresLogoFile;
            element_name = "Water";
            break;
        default:
            return <></>;
    }

    return (
        <img
            key={index}
            src={image_src}
            className="threslogo"
            style={styling}
            alt={element_name}
            title={element_name}
        />
    );
};

function App() {
    const GUESSES_UNTIL_HINT = 7;

    const [cardsData, setCardsData] = useState<Card[]>(cardsJson);
    const [guesses, setGuesses] = useState<Guess[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [suggestions, setSuggestions] = useState<Card[]>([]);
    const [targetCard, setTargetCard] = useState<Card>(getDailyCard());
    const [gameWon, setGameWon] = useState(false);
    const [hintRevealed, setHintRevealed] = useState(false);
    const [todayDate, setTodayDate] = useState<string>(
        new Date().toDateString()
    );
    const [showingSuggestionMenu, setShowingSuggestionMenu] = useState(false);
    const [shared, setShared] = useState(false);
    const [previewedCard, setPreviewedCard] = useState<Card>(NONE_CARD);

    function RulesText() {
        const revealHint = () => {
            setHintRevealed(true);
        };

        const rulesNotRevealedMessage = (
            <p>
                Rules text revealed in {GUESSES_UNTIL_HINT - guesses.length}{" "}
                guess(es)
            </p>
        );
        const rulesHintMessage = <p>{rulesTextHint()}</p>;
        const revealHintButton = (
            <button onClick={revealHint}>Reveal Hint</button>
        );

        if (!canRevealHint()) {
            return rulesNotRevealedMessage;
        }
        if (hintRevealed) {
            return rulesHintMessage;
        }
        if (!hintRevealed && canRevealHint()) {
            return revealHintButton;
        }
        return <p>wtf bro</p>;
    }

    function getCardByName(card_name: string): Card {
        const foundCard = cardsJson.find((card) => card.name === card_name);
        if (foundCard !== undefined) {
            return foundCard;
        }
        return NONE_CARD;
    }

    function getDailyCard(): Card {
        const today = new Date();
        const year = today.getFullYear().toString();
        const month = today.getMonth().toString();
        const date = today.getDate().toString();
        const isAprilFools = month === "3" && date === "1";
        if (isAprilFools) {
            const craigCard = getCardByName("Craig Sumison");
            if (craigCard.name !== "") {
                return craigCard;
            }
        }
        let hashExtension = "";
        for (let i = 0; i < 10; i++) {
            const hashed_index =
                simpleHash(
                    `${year}/${month}/${date}${hashExtension}new update`
                ) % cardsJson.length;
            const todaysCard = cardsJson[hashed_index];
            if (todaysCard.name === "Craig Sumison") {
                hashExtension += "!";
            } else {
                return todaysCard;
            }
        }

        const hashed_index =
            simpleHash(`${year}/${month}/${date}NotCraig`) % cardsJson.length;
        return cardsJson[hashed_index];
    }

    useEffect(() => {
        // setCardsData(cardsJson);
        // setTargetCard();
        // setTodayDate();
    }, []);

    useEffect(() => {}, [currentAnswer]);

    const handleGuessInputChange = (value: string) => {
        // if (!showingSuggestionMenu) {
        //     return;
        // }

        if (value !== "") {
            setCurrentAnswer(value);
        }

        if (value.length > 0) {
            const filteredSuggestions = cardsData
                .map((card) => {
                    if (startsWith(card.name, value)) {
                        return { card: card, score: 2 };
                    }
                    if (substring(card.name, value)) {
                        return { card: card, score: 1 };
                    }
                    return { card: card, score: 0 };
                })
                .sort((a, b) =>
                    b.score < a.score
                        ? -1
                        : b.score > a.score
                        ? 1
                        : b.card.name < a.card.name
                        ? 1
                        : -1
                )
                .slice()
                .filter((pair) => pair.score > 0)
                .map((pair) => pair.card);

            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    const preloadCardImage = (card_name: string): void => {
        const image_url = getCardImageUrl(card_name);
        const img = new Image();
        img.src = image_url;
    };

    const handleSubmit = (e: { preventDefault: () => void }): void => {
        e.preventDefault();

        // try to find a card that matches what the user has submitted
        const guessedCard = cardsData.find((card) =>
            compareStrings(card.name, currentAnswer)
        );
        if (guessedCard === undefined) {
            return;
        }
        // Check if you haven't already guessed the card
        if (!guesses.some((guess) => guess.card.name === guessedCard.name)) {
            const currentGuess: Guess = {
                card: guessedCard,
                resultTexts: [],
                resultStyles: [],
            };
            if (targetCard !== undefined) {
                // Its a new guess, so add it to the guesses list and preload the card image
                preloadCardImage(guessedCard.name);
                setGuessResults(currentGuess, guessedCard, targetCard);
                setGuesses([currentGuess, ...guesses]);
                if (targetCard.name === guessedCard.name) {
                    setGameWon(true);
                }
            }
        }
        setCurrentAnswer("");
    };

    const setGuessResults = (
        currentGuess: Guess,
        guessedCard: Card,
        targetCard: Card
    ): void => {
        zip(cardsToArray(guessedCard), cardsToArray(targetCard)).forEach(
            (valuePair) => {
                const guessedValue = valuePair[0];
                const targetValue = valuePair[1];

                if (
                    typeof guessedValue === "number" &&
                    typeof targetValue === "number"
                ) {
                    let emoji = "";
                    let style = "right";
                    if (guessedValue < targetValue) {
                        if (guessedValue >= 0) {
                            emoji = " ⬆️";
                        }
                        style = "wrong";
                    } else if (guessedValue > targetValue) {
                        if (targetValue >= 0) {
                            emoji = " ⬇️";
                        } else {
                            emoji = " 🚫";
                        }
                        style = "wrong";
                    }
                    if (guessedValue < 0) {
                        currentGuess.resultTexts.push(`-`);
                    } else {
                        currentGuess.resultTexts.push(
                            `${guessedValue}${emoji}`
                        );
                    }
                    currentGuess.resultStyles.push(style);
                } else if (
                    typeof guessedValue === "string" &&
                    typeof targetValue === "string"
                ) {
                    let style = "wrong";
                    if (guessedValue == targetValue) {
                        style = "right";
                    }
                    currentGuess.resultStyles.push(style);
                    currentGuess.resultTexts.push(`${guessedValue}`);
                } else if (
                    guessedValue instanceof Array &&
                    targetValue instanceof Array
                ) {
                    let style = "wrong";
                    if (guessedValue.length == targetValue.length) {
                        if (
                            guessedValue.sort().join(",") ===
                            targetValue.sort().join(",")
                        ) {
                            style = "right";
                        }
                    }
                    if (style !== "right") {
                        if (
                            targetValue.some((elem) =>
                                guessedValue.includes(elem)
                            )
                        ) {
                            style = "partial";
                        }
                    }
                    // currentGuess.resultTexts.push(`${guessedValue.join(", ")}`);
                    currentGuess.resultTexts.push(
                        <>
                            {guessedValue
                                .map((elem) => {
                                    if (typeof elem == "string") {
                                        switch (elem) {
                                            case "(A)":
                                                return thresCharToLogoMap(
                                                    "A",
                                                    0,
                                                    { width: "1em" }
                                                );
                                            case "(E)":
                                                return thresCharToLogoMap(
                                                    "E",
                                                    0,
                                                    { width: "1em" }
                                                );
                                            case "(F)":
                                                return thresCharToLogoMap(
                                                    "F",
                                                    0,
                                                    { width: "1em" }
                                                );
                                            case "(W)":
                                                return thresCharToLogoMap(
                                                    "W",
                                                    0,
                                                    { width: "1em" }
                                                );
                                            case "Alpha":
                                            case "Beta":
                                            case "Arthurian Legends":
                                            case "Craig":
                                                return setToLogoMap(elem, 0, {
                                                    width: "2em",
                                                });
                                            default:
                                                return <>{elem}</>;
                                        }
                                    }
                                })
                                .reduce(
                                    (acc, x) =>
                                        acc === undefined ? (
                                            x
                                        ) : (
                                            <>
                                                {acc}
                                                {", "}
                                                {x}
                                            </>
                                        ),
                                    undefined
                                )}
                        </>
                    );
                    currentGuess.resultStyles.push(style);
                } else if (
                    isThresholds(guessedValue) &&
                    isThresholds(targetValue)
                ) {
                    let style = "wrong";
                    const guessedList = thresholdAsList(guessedValue);
                    const targetList = thresholdAsList(targetValue);
                    if (guessedList.length == targetList.length) {
                        if (
                            guessedList.sort().slice().join(",") ===
                            targetList.sort().slice().join(",")
                        ) {
                            style = "right";
                        }
                    }
                    if (style !== "right") {
                        if (
                            targetList.some((elem) =>
                                guessedList.includes(elem)
                            )
                        ) {
                            style = "partial";
                        }
                    }
                    currentGuess.resultTexts.push(
                        <>
                            {guessedList.map((element, index) =>
                                thresCharToLogoMap(element, index)
                            )}
                        </>
                    );
                    currentGuess.resultStyles.push(style);
                } else if (isRarity(guessedValue) && isRarity(targetValue)) {
                    let style = "right";
                    let emoji = "";
                    if (guessedValue.rank < targetValue.rank) {
                        if (guessedValue.rank >= 0) {
                            emoji = " ⬆️";
                        }
                        style = "wrong";
                    }
                    if (guessedValue.rank > targetValue.rank) {
                        if (targetValue.rank >= 0) {
                            emoji = " ⬇️";
                        }
                        style = "wrong";
                    }
                    if (guessedValue.rank < 0) {
                        currentGuess.resultTexts.push(`-`);
                    } else {
                        currentGuess.resultTexts.push(
                            `${guessedValue.name}${emoji}`
                        );
                    }
                    currentGuess.resultStyles.push(style);
                } else {
                    currentGuess.resultTexts.push(guessedValue);
                    currentGuess.resultStyles.push("none");
                }
            }
        );
    };

    const getCardImageUrl = (cardName: string): string => {
        const card_url = cardImageUrls.find(
            (override) => override.name === cardName
        );
        if (card_url !== undefined) {
            return card_url.url;
        }
        return "";
    };
    const canRevealHint = () => guesses.length >= GUESSES_UNTIL_HINT;

    const rulesTextHint = (): string => {
        if (targetCard) {
            let hintText;
            if (targetCard.name === "Craig Sumison") {
                hintText =
                    "■■■■■ ■■■■■■■ has worked in Real Estate for 18 years and has been the Principal / Director of Raine & Horne Roxby Downs since February 2008.";
            } else if (targetCard.rules_text !== "") {
                hintText = replaceAll(
                    targetCard.rules_text,
                    targetCard.name,
                    "■".repeat(targetCard.name.length)
                );
            } else if (targetCard.flavour_text !== "") {
                hintText = replaceAll(
                    targetCard.flavour_text,
                    targetCard.name,
                    "■".repeat(targetCard.name.length)
                );
            } else {
                hintText = targetCard.type_text;
            }
            return "Hint: " + hintText;
        }
        return "No hint for today...";
    };

    const copyShareToClipboard = () => {
        setShared(true);
        const link = "https://sorcerdle.com/";
        const emojiMatrix = guesses
            .map((guess) => {
                return guess.resultStyles
                    .map((style) => {
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
                    })
                    .join("");
            })
            .join("\n");
        navigator.clipboard.writeText(
            `Sorcerdle - ${todayDate} (${guesses.length} Guesses${
                hintRevealed ? " + Hint" : ""
            })\n${link}\n${emojiMatrix}`
        );
    };
    const winDisplay = (
        <span className="win-container">
            <p>🥳🎉You Won!!!💯🎊</p>
            <span className="share-button-container">
                <button onClick={copyShareToClipboard} className="share-button">
                    {shared ? "Copied" : "Share"}
                </button>
                <button
                    className="small-hire-me"
                    onClick={() =>
                        window.open(
                            "https://www.linkedin.com/in/mustafa-xyz/",
                            "_blank"
                        )
                    }
                >
                    <p className="rainbowText">
                        <i>Hire Me! Pls</i>
                    </p>
                </button>
            </span>
        </span>
    );

    const isItCoolTime = (): boolean => {
        const d = new Date();
        const hour = d.getHours();
        return hour == 20 || hour == 21;
    };

    return (
        <>
            <span id="top-container">
                <span id="left-side">
                    <a
                        href="https://github.com/itsjustmustafa/sorcerdle#sorcerdle"
                        target="_blank"
                        id="source-link"
                    >
                        Source / Bug report
                    </a>
                </span>
                <span id="right-side">
                    <a
                        href="https://github.com/itsjustmustafa/sorcerdle/#how-to-play"
                        target="_blank"
                        id="help-link"
                    >
                        How To Play
                    </a>
                    {/* <span id="coming-soon-message">
                        <img src="https://i.imgur.com/j5AjtIL.png" />
                        Coming Soon
                    </span> */}
                </span>
            </span>
            <div className="game">
                <h1 id="title">Sorcerdle!</h1>
                <span className="input-container">
                    <Select
                        className="guess-input"
                        options={suggestions.map((suggestion) => {
                            return {
                                value: suggestion.name,
                                label: suggestion.name,
                            };
                        })}
                        onInputChange={handleGuessInputChange}
                        onChange={(newValue) =>
                            showingSuggestionMenu
                                ? setCurrentAnswer(
                                      newValue
                                          ? newValue.value === ""
                                              ? "nothing"
                                              : newValue.value
                                          : "uhoh"
                                  )
                                : null
                        }
                        onMenuOpen={() => setShowingSuggestionMenu(true)}
                        onMenuClose={() => setShowingSuggestionMenu(false)}
                        styles={{
                            dropdownIndicator: (defaultStyles) => ({
                                ...defaultStyles,
                                display: "none",
                            }),
                        }}
                        placeholder={"Type a card name..."}
                    />
                    <button onClick={handleSubmit} disabled={gameWon}>
                        Submit
                    </button>
                </span>
                {!gameWon && (
                    <span className="rules-container">
                        <RulesText />
                    </span>
                )}
                {gameWon && winDisplay}
                <div className="table-container">
                    <table className="guesses-table">
                        <thead>
                            <tr>
                                {attributeDisplayNames.map(
                                    (attribute, index) => (
                                        <th key={index}>{attribute}</th>
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {guesses.map((guess, index) => (
                                <tr key={index}>
                                    {zip(
                                        guess.resultTexts,
                                        guess.resultStyles
                                    ).map((textStylePair, index: number) => (
                                        <>
                                            {index !== 0 && (
                                                <td
                                                    key={index}
                                                    className={`result-${textStylePair[1]}`}
                                                >
                                                    {textStylePair[0]}
                                                </td>
                                            )}
                                            {index === 0 && (
                                                <td
                                                    key={index}
                                                    className={`result-${textStylePair[1]}`}
                                                    onClick={() =>
                                                        setPreviewedCard(
                                                            guess.card.name ===
                                                                previewedCard.name
                                                                ? NONE_CARD
                                                                : guess.card
                                                        )
                                                    }
                                                >
                                                    <span className="card-name-container">
                                                        {guess.card.name}
                                                        <br />
                                                        <span>
                                                            {guess.card.name ===
                                                                previewedCard.name && (
                                                                <u>Hide</u>
                                                            )}
                                                            {guess.card.name !==
                                                                previewedCard.name && (
                                                                <u>Show</u>
                                                            )}
                                                        </span>
                                                        <div
                                                            className={
                                                                "card-image-popup card-preview " +
                                                                (guess.card
                                                                    .type ===
                                                                "Site"
                                                                    ? " site-img"
                                                                    : "")
                                                            }
                                                        >
                                                            {guess.card.name ==
                                                                previewedCard.name && (
                                                                <img
                                                                    src={getCardImageUrl(
                                                                        previewedCard.name
                                                                    )}
                                                                    alt={
                                                                        previewedCard.name
                                                                    }
                                                                />
                                                            )}
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
                <span className="card_image_mobile_modal">
                    {previewedCard.name !== "" && (
                        <img
                            className={
                                "card_image_mobile card-preview " +
                                (previewedCard.type === "Site"
                                    ? "site-img"
                                    : "nonsite-img")
                            }
                            src={getCardImageUrl(previewedCard.name)}
                            alt={previewedCard.name}
                            onClick={() => setPreviewedCard(NONE_CARD)}
                        />
                    )}
                </span>
            </div>
        </>
    );
}

export default App;
