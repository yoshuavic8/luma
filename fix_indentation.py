import re
import sys

def fix_indentation(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the handleVerseSelect function
    pattern = r'const handleVerseSelect = async \(verse: BibleVerse\) => \{(.*?)\};'
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        function_body = match.group(1)
        print("Found handleVerseSelect function:")
        
        # Count opening and closing braces
        opening_braces = function_body.count('{')
        closing_braces = function_body.count('}')
        
        print(f"Opening braces: {opening_braces}")
        print(f"Closing braces: {closing_braces}")
        
        # Check if braces are balanced
        if opening_braces != closing_braces:
            print("Braces are not balanced!")
        else:
            print("Braces are balanced.")
    else:
        print("Could not find handleVerseSelect function.")
    
    # Check the end of the file
    last_lines = content.split('\n')[-10:]
    print("\nLast 10 lines of the file:")
    for i, line in enumerate(last_lines):
        print(f"{i+1}: {line}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = "src/app/bible-search/page.tsx"
    
    fix_indentation(file_path)
