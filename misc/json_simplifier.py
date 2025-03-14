import json
import re

all_data = []
with open("new_sorcerycards.json") as file:
    all_data = json.load(file)

all_data.sort(key=lambda card: card["name"])

simplified_data = []

clean_text = lambda text: re.sub(r"([\\\r\\\n]+\s*)+", " | ", text)
clean_text_no_bar = lambda text: re.sub(r"([\\\r\\\n]+\s*)+", " ", text)
clean_text_single_space = lambda text: re.sub(r"\s+", " ", clean_text_no_bar(text))

to_int = lambda value: -1 if value is None else value


def get_set_names(card_data):
    return [set_["name"] for set_ in card_data["sets"]]


for card_data in all_data:
    # print(card_data["name"])
    thresholds = {
        "air": card_data["guardian"]["thresholds"]["air"],
        "earth": card_data["guardian"]["thresholds"]["earth"],
        "fire": card_data["guardian"]["thresholds"]["fire"],
        "water": card_data["guardian"]["thresholds"]["water"],
    }
    new_entry = {
        "name": card_data["name"],
        "rarity": card_data["guardian"]["rarity"],
        "type_text": card_data["sets"][-1]["variants"][0]["typeText"],
        "type": card_data["guardian"]["type"],
        "subtypes": [
            subtype for subtype in card_data["subTypes"].split(", ") if len(subtype) > 0
        ],
        "rules_text": clean_text(card_data["guardian"]["rulesText"]),
        "cost": to_int(card_data["guardian"]["cost"]),
        "attack": to_int(card_data["guardian"]["attack"]),
        "defence": to_int(card_data["guardian"]["defence"]),
        "life": to_int(card_data["guardian"]["life"]),
        "thresholds": thresholds,
        "sets": get_set_names(card_data),
        "flavour_text": clean_text_single_space(
            card_data["sets"][-1]["variants"][0]["flavorText"]
        ),
    }
    simplified_data.append(new_entry)
    print(f"Processed {card_data['name']}")

with open("sorcerycards.json", "w") as outfile:
    json.dump(simplified_data, outfile)
print("Done")
