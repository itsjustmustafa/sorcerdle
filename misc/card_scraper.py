import json
import urllib.parse
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import urllib

card_names = []
with open("sorcerycards.json", "r") as file:
    card_names = [card["name"] for card in json.load(file)]


chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--headless")
driver = webdriver.Chrome(options=chrome_options)
card_image_urls = []

for card_name in card_names:
    encoded_card_name = urllib.parse.quote(card_name)
    url = f"https://fourcores.xyz/card/{encoded_card_name}"
    driver.get(url)
    try:

        image_url = ""
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "chakra-image"))
        )
        all_chakra_texts = driver.find_elements(By.CLASS_NAME, "chakra-text")
        for chakra_text in all_chakra_texts:
            if chakra_text.text == "β":
                parent_element = chakra_text.find_element(By.XPATH, "..")
                parent_element.click()

        images = driver.find_elements(By.CLASS_NAME, "chakra-image")
        for image in images:
            if image.tag_name == "img":
                src = image.get_attribute("src")
                if src.startswith("https://fourcores.xyz/.netlify/images"):
                    image_url = src
                    break
        if len(image_url) == 0:
            print(f"Could not get {card_name}")
            print(f"@ {url}")
            break
        card_image_urls.append({"name": card_name, "url": image_url})
        print(f"Done for {card_name}:\t{image_url}")
    except Exception as e:
        print("-----\n" * 3)
        print(e)
        print(f"Error on {card_name} @ {url}")
        break


driver.quit()

with open("card_image_urls.json", "w") as outfile:
    json.dump(card_image_urls, outfile)
print("Done")
