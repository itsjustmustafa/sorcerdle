#!/bin/sh 
for file in ./card_data/*.json; do
    jq -c '{
  card_name: .pageProps.trpcState.json.queries[0].state.data.name,
  rarity: .pageProps.trpcState.json.queries[0].state.data.guardian.rarity,
  type_text: .pageProps.trpcState.json.queries[0].state.data.variants[0].vMeta.typeText,
  type: .pageProps.trpcState.json.queries[0].state.data.guardian.type,
  subtype: "",
  rules_text: .pageProps.trpcState.json.queries[0].state.data.guardian.rulesText,
  cost: .pageProps.trpcState.json.queries[0].state.data.guardian.cost,
  attack: .pageProps.trpcState.json.queries[0].state.data.guardian.attack,
  defence: .pageProps.trpcState.json.queries[0].state.data.guardian.defence,
  life: (.pageProps.trpcState.json.queries[0].state.data.guardian.life // -1),
  thresholds: {
    air: .pageProps.trpcState.json.queries[0].state.data.guardian.airThreshold,
    earth: .pageProps.trpcState.json.queries[0].state.data.guardian.earthThreshold,
    fire: .pageProps.trpcState.json.queries[0].state.data.guardian.fireThreshold,
    water: .pageProps.trpcState.json.queries[0].state.data.guardian.waterThreshold
  },
  flavour_text: .pageProps.trpcState.json.queries[0].state.data.variants[0].vMeta.flavorText
}' "$file" >> temp.jsonc
done;

jq --slurp 'map(
  . + {
    subtype: (
      if (.card_name == "Arid Desert" or .card_name == "Red Desert" or .card_name == "Remote Desert")
      then "Desert"
      elif (.card_name == "Dark Tower" or .card_name == "Lone Tower" or .card_name == "Gothic Tower")
      then "Tower"
      elif (.card_name == "Humble Village" or .card_name == "Rustic Village" or .card_name == "Simple Village")
      then "Village"
      elif (.card_name == "Spring River" or .card_name == "Autumn River" or .card_name == "Summer River" or .card_name == "Winter River")
      then "River"
      else (
        ([
          {"keyword": "Angel", "condition": (.type_text // "") | contains("Angel")},
          {"keyword": "Beast", "condition": (.type_text // "") | contains("Beast")},
          {"keyword": "Demon", "condition": (.type_text // "") | contains("Demon")},
          {"keyword": "Dragon", "condition": (.type_text // "") | contains("Dragon")},
          {"keyword": "Dwarf", "condition": (.type_text // "") | contains("Dwarf")},
          {"keyword": "Faerie", "condition": (.type_text // "") | contains("Faerie")},
          {"keyword": "Giant", "condition": (.type_text // "") | contains("Giant")},
          {"keyword": "Gnome", "condition": (.type_text // "") | contains("Gnome")},
          {"keyword": "Goblin", "condition": (.type_text // "") | contains("Goblin")},
          {"keyword": "Knight", "condition": (.type_text // "") | contains("Knight")},
          {"keyword": "Merfolk", "condition": (.type_text // "") | contains("Merfolk")},
          {"keyword": "Monster", "condition": (.type_text // "") | contains("Monster")},
          {"keyword": "Mortal", "condition": (.type_text // "") | contains("Mortal")},
          {"keyword": "Ogre", "condition": (.type_text // "") | contains("Ogre")},
          {"keyword": "Royalty", "condition": (.type_text // "") | contains("Royalty")},
          {"keyword": "Spirit", "condition": (.type_text // "") | contains("Spirit")},
          {"keyword": "Sphinx", "condition": (.type_text // "") | contains("Sphinx")},
          {"keyword": "Troll", "condition": (.type_text // "") | contains("Troll")},
          {"keyword": "Undead", "condition": (.type_text // "") | contains("Undead")},
          {"keyword": "Armor", "condition": (.type_text // "") | contains("Armor")},
          {"keyword": "Automaton", "condition": (.type_text // "") | contains("Automaton")},
          {"keyword": "Device", "condition": (.type_text // "") | contains("Device")},
          {"keyword": "Document", "condition": (.type_text // "") | contains("Document")},
          {"keyword": "Instruments", "condition": (.type_text // "") | contains("Instruments")},
          {"keyword": "Monument", "condition": (.type_text // "") | contains("Monument")},
          {"keyword": "Potion", "condition": (.type_text // "") | contains("Potion")},
          {"keyword": "Relic", "condition": (.type_text // "") | contains("Relic")},
          {"keyword": "Weapon", "condition": (.type_text // "") | contains("Weapon")},
          {"keyword": "River", "condition": (.type_text // "") | contains("River")},
          {"keyword": "Tower", "condition": (.type_text // "") | contains("Tower")},
          {"keyword": "Village", "condition": (.type_text // "") | contains("Village")}
        ] | map(select(.condition) | .keyword) | first)
      )
      end)
  }
)' temp.jsonc > ../sorcerycards.json

rm temp.jsonc 
