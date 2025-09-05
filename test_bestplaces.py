#!/usr/bin/env python3
"""
Test script to verify Best Places URL generation logic
"""

import re
from urllib.parse import quote

def test_bestplaces_url_generation(location):
    """Test the Best Places URL generation logic"""
    print(f"Testing location: {location}")
    
    # Extract zip code from location string
    zip_match = re.search(r',\s*(\d{5}(?:-\d{4})?)$', location)
    
    if zip_match:
        zip_code = zip_match.group(1).split('-')[0]  # Remove +4 extension if present
        best_places_url = f'https://www.bestplaces.net/search/?q={zip_code}'
        print(f"📍 Best Places URL with zip code {zip_code}: {best_places_url}")
    else:
        # Fallback: search the entire location string
        encoded_location = quote(location.strip())
        best_places_url = f'https://www.bestplaces.net/search/?q={encoded_location}'
        print(f"🔍 Best Places URL with full location: {best_places_url}")
    
    print()

if __name__ == "__main__":
    # Test cases
    test_cases = [
        "123 Main St, Irvine, CA, 92618",  # User's example
        "Location 1: 456 Oak Ave, San Francisco, CA, 94102",
        "789 Pine St, New York, NY, 10001-1234",  # With +4 zip
        "321 Elm St, Austin, TX",  # No zip code
        "555 Maple Dr, Denver, CO, 80202",
        "Some Random Address"  # No pattern match
    ]
    
    for test_case in test_cases:
        test_bestplaces_url_generation(test_case)
