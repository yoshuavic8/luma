import json
import os
import sys

def analyze_bible_file(file_path):
    """Analyze a Bible JSON file and check its structure."""
    print(f"\nAnalyzing Bible file: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            bible_data = json.load(f)
        
        # Check basic structure
        print(f"File loaded successfully. Type: {type(bible_data)}")
        
        if not isinstance(bible_data, dict):
            print(f"WARNING: Bible data is not a dictionary, it's a {type(bible_data)}")
            return
        
        # Check for expected keys
        print(f"Top-level keys: {list(bible_data.keys())}")
        
        if 'verses' not in bible_data:
            print("WARNING: 'verses' key not found in Bible data")
            return
        
        verses = bible_data['verses']
        print(f"Number of verses: {len(verses)}")
        
        # Check the structure of the first verse
        if len(verses) > 0:
            first_verse = verses[0]
            print(f"First verse structure: {list(first_verse.keys())}")
            print(f"First verse: {first_verse}")
        
        # Check for specific verses
        specific_verses = [
            {"book": "Amsal", "chapter": 10, "verse": 17},
            {"book": "Yeremia", "chapter": 21, "verse": 8},
            {"book": "Wahyu", "chapter": 22, "verse": 2}
        ]
        
        for verse_info in specific_verses:
            book = verse_info["book"]
            chapter = verse_info["chapter"]
            verse = verse_info["verse"]
            
            # Try to find the verse
            found_verses = [v for v in verses if 
                           (v.get('book_name', '').lower() == book.lower() and 
                            v.get('chapter') == chapter and 
                            v.get('verse') == verse)]
            
            if found_verses:
                print(f"Found {book} {chapter}:{verse}: {found_verses[0]}")
            else:
                # Try a more flexible search
                book_matches = [v for v in verses if v.get('book_name', '').lower() == book.lower()]
                if book_matches:
                    print(f"Found book '{book}' with {len(book_matches)} verses")
                    chapter_matches = [v for v in book_matches if v.get('chapter') == chapter]
                    if chapter_matches:
                        print(f"Found chapter {chapter} with {len(chapter_matches)} verses")
                        print(f"Available verses in {book} {chapter}: {sorted(set(v.get('verse') for v in chapter_matches))}")
                    else:
                        print(f"No verses found for chapter {chapter}")
                        print(f"Available chapters in {book}: {sorted(set(v.get('chapter') for v in book_matches))}")
                else:
                    # Check for partial book name matches
                    partial_matches = [v for v in verses if book.lower() in v.get('book_name', '').lower()]
                    if partial_matches:
                        book_names = sorted(set(v.get('book_name') for v in partial_matches))
                        print(f"No exact match for '{book}', but found similar books: {book_names}")
                    else:
                        # List all available books
                        all_books = sorted(set(v.get('book_name') for v in verses))
                        print(f"No match for '{book}'. Available books: {all_books}")
        
        # Check for book name variations
        book_names = {}
        for verse in verses:
            book_name = verse.get('book_name', '')
            if book_name:
                book_names[book_name] = book_names.get(book_name, 0) + 1
        
        print("\nBook name variations and verse counts:")
        for book, count in sorted(book_names.items(), key=lambda x: x[1], reverse=True):
            print(f"  {book}: {count} verses")
            
    except Exception as e:
        print(f"Error analyzing file: {e}")

def main():
    # Check Indonesian Bible files
    indo_tb_path = os.path.join('public', 'assets', 'bible', 'ID-Indonesian', 'indo_tb.json')
    indo_tm_path = os.path.join('public', 'assets', 'bible', 'ID-Indonesian', 'indo_tm.json')
    
    # Check English Bible files
    en_asv_path = os.path.join('public', 'assets', 'bible', 'EN-English', 'asv.json')
    
    # Analyze each file
    for file_path in [indo_tb_path, indo_tm_path, en_asv_path]:
        if os.path.exists(file_path):
            analyze_bible_file(file_path)
        else:
            print(f"\nFile not found: {file_path}")
            # Try with absolute path
            abs_path = os.path.join(os.getcwd(), file_path)
            if os.path.exists(abs_path):
                analyze_bible_file(abs_path)
            else:
                print(f"File also not found at absolute path: {abs_path}")

if __name__ == "__main__":
    main()
