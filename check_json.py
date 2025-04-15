import json
import os

# Path to the JSON files
daily_json_path = 'public/assets/bible/daily/daily.json'
verses_json_path = 'public/assets/bible/daily/verses.json'

# Check if files exist
print(f"Checking if {daily_json_path} exists: {os.path.exists(daily_json_path)}")
print(f"Checking if {verses_json_path} exists: {os.path.exists(verses_json_path)}")

# Read daily.json
try:
    with open(daily_json_path, 'r', encoding='utf-8') as f:
        daily_data = json.load(f)
    print(f"\nSuccessfully loaded {daily_json_path}")
    print(f"Type: {type(daily_data)}")
    if isinstance(daily_data, list):
        print(f"Length: {len(daily_data)}")
        if len(daily_data) > 0:
            print(f"First item: {daily_data[0]}")
    else:
        print(f"Structure: {daily_data.keys() if isinstance(daily_data, dict) else 'Not a dictionary'}")
except Exception as e:
    print(f"Error reading {daily_json_path}: {e}")

# Read verses.json
try:
    with open(verses_json_path, 'r', encoding='utf-8') as f:
        verses_data = json.load(f)
    print(f"\nSuccessfully loaded {verses_json_path}")
    print(f"Type: {type(verses_data)}")
    if isinstance(verses_data, list):
        print(f"Length: {len(verses_data)}")
        if len(verses_data) > 0:
            print(f"First item: {verses_data[0]}")
    else:
        print(f"Structure: {verses_data.keys() if isinstance(verses_data, dict) else 'Not a dictionary'}")
except Exception as e:
    print(f"Error reading {verses_json_path}: {e}")

# If both files exist, create a merged version with the structure of verses.json
if os.path.exists(daily_json_path) and os.path.exists(verses_json_path):
    try:
        # Convert daily_data to the format of verses_data if needed
        if isinstance(daily_data, list) and isinstance(verses_data, list):
            # Check the structure of the first item in each list
            if len(daily_data) > 0 and len(verses_data) > 0:
                daily_keys = set(daily_data[0].keys() if isinstance(daily_data[0], dict) else [])
                verses_keys = set(verses_data[0].keys() if isinstance(verses_data[0], dict) else [])
                
                print(f"\nDaily.json keys: {daily_keys}")
                print(f"Verses.json keys: {verses_keys}")
                
                # If the structures are different, convert daily_data to verses_data format
                if daily_keys != verses_keys:
                    print("\nStructures are different. Converting daily.json to verses.json format...")
                    
                    # Map fields from daily.json to verses.json format
                    # This is a placeholder - you'll need to adjust based on actual structure
                    converted_data = []
                    for i, item in enumerate(daily_data):
                        if isinstance(item, dict):
                            converted_item = {
                                "id": item.get("id", i + 1),
                                "ayat": item.get("ayat", item.get("reference", "Unknown")),
                                "content": item.get("content", item.get("text", ""))
                            }
                            converted_data.append(converted_item)
                    
                    # Save the converted data to verses.json
                    with open(verses_json_path, 'w', encoding='utf-8') as f:
                        json.dump(converted_data, f, ensure_ascii=False, indent=2)
                    print(f"Converted data saved to {verses_json_path}")
                else:
                    print("\nStructures are the same. No conversion needed.")
    except Exception as e:
        print(f"Error processing files: {e}")
