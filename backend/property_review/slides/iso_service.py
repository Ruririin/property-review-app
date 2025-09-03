"""
ISO Code Service for Property Review
Backend implementation of ISO code matching functionality
"""

import csv
import os
from django.conf import settings
from django.core.cache import cache
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class ISOCodeService:
    """
    Service for handling ISO code matching and lookup
    """
    
    def __init__(self):
        self.iso_codes = []
        self.is_loaded = False
    
    def load_iso_codes(self) -> List[Dict]:
        """
        Load ISO codes from CSV file with caching
        """
        # Check cache first
        cached_codes = cache.get('iso_codes')
        if cached_codes:
            self.iso_codes = cached_codes
            self.is_loaded = True
            return self.iso_codes
        
        try:
            # Path to CSV file in frontend public directory
            csv_path = os.path.join(
                settings.BASE_DIR.parent, 
                'frontend', 
                'public', 
                'data', 
                'ISO Class Codes - InsuranceXdate site(Table 1).csv'
            )
            
            if not os.path.exists(csv_path):
                logger.error(f"ISO codes CSV file not found at: {csv_path}")
                return []
            
            with open(csv_path, 'r', encoding='utf-8') as file:
                csv_reader = csv.reader(file)
                next(csv_reader)  # Skip header row
                
                self.iso_codes = []
                for row in csv_reader:
                    if len(row) >= 2 and row[0].strip() and row[1].strip():
                        code = row[0].strip()
                        description = row[1].strip()
                        
                        self.iso_codes.append({
                            'code': code,
                            'description': description,
                            'keywords': description.lower()
                        })
            
            # Cache for 1 hour
            cache.set('iso_codes', self.iso_codes, 3600)
            self.is_loaded = True
            logger.info(f"Loaded {len(self.iso_codes)} ISO codes")
            
        except Exception as e:
            logger.error(f"Error loading ISO codes: {str(e)}")
            self.iso_codes = []
        
        return self.iso_codes
    
    def find_best_match(self, description: str) -> Optional[Dict]:
        """
        Find the best matching ISO code for a given description
        """
        if not description or not self.iso_codes:
            return None
        
        search_text = description.lower()
        words = [word for word in search_text.split() if len(word) > 2]
        
        best_match = None
        best_score = 0
        
        for iso_code in self.iso_codes:
            score = 0
            
            # Check for exact phrase matches
            if search_text in iso_code['keywords']:
                score += 10
            
            # Check for word matches
            for word in words:
                if word in iso_code['keywords']:
                    score += 1
            
            if score > best_score:
                best_score = score
                best_match = iso_code
        
        return best_match
    
    def find_similar_matches(self, description: str, min_score: int = 1, max_results: int = 5) -> List[Dict]:
        """
        Find multiple matching ISO codes for a given description
        """
        if not description or not self.iso_codes:
            return []
        
        search_text = description.lower()
        words = [word for word in search_text.split() if len(word) > 2]
        
        matches = []
        
        for iso_code in self.iso_codes:
            score = 0
            
            # Check for exact phrase matches
            if search_text in iso_code['keywords']:
                score += 10
            
            # Check for word matches
            for word in words:
                if word in iso_code['keywords']:
                    score += 1
            
            if score >= min_score:
                match_data = iso_code.copy()
                match_data['score'] = score
                matches.append(match_data)
        
        # Sort by score (highest first) and return top matches
        matches.sort(key=lambda x: x['score'], reverse=True)
        return matches[:max_results]
    
    def get_all_codes(self) -> List[Dict]:
        """
        Get all loaded ISO codes
        """
        if not self.is_loaded:
            self.load_iso_codes()
        return self.iso_codes

# Global service instance
iso_service = ISOCodeService()