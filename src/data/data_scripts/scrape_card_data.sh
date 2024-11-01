#!/bin/sh 
cat card_names | xargs -I % sh -c 'curl https://curiosa.io/_next/data/q3iy0bGQ1tL-SdRDCt0GD/cards/%.json > card_data/%.json'
