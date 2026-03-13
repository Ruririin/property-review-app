// Service to fetch ISO codes from CSV file (original system)
let isoCodes = [];
let isLoading = false;
let isLoaded = false;

const loadIsoCodes = async () => {
  if (isLoaded || isLoading) return isoCodes;
  
  isLoading = true;
  try {
    const response = await fetch('/data/ISO Class Codes - InsuranceXdate site(Table 1).csv');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    isoCodes = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // Split CSV line properly (handle commas in descriptions)
        const parts = line.split(',');
        const code = parts[0]?.replace(/"/g, '').trim();
        const description = parts[1]?.replace(/"/g, '').trim();
        
        if (code && description) {
          // Clean description by removing everything after "--" (double dash)
          const cleanDescription = description.split('--')[0].trim();
          
          isoCodes.push({
            code: code,
            description: cleanDescription,
            full_text: `${code} - ${cleanDescription}`,
            keywords: cleanDescription.toLowerCase()
          });
        }
      }
    }
    
    isLoaded = true;
    // console.log(`Loaded ${isoCodes.length} ISO codes from CSV file`);
    
  } catch (error) {
    console.error('Failed to load ISO codes from CSV file:', error);
    isoCodes = [];
  } finally {
    isLoading = false;
  }
  
  return isoCodes;
};

const findBestMatch = (searchTerm) => {
  if (!searchTerm || !isoCodes.length) return null;
  
  const searchText = searchTerm.trim();
  
  // First, try exact code match
  let bestMatch = isoCodes.find(isoCode => isoCode.code === searchText);
  if (bestMatch) {
    // console.log('Found exact code match:', bestMatch);
    return bestMatch;
  }
  
  // Then try description search (original functionality)
  const searchLower = searchText.toLowerCase();
  const words = searchLower.split(/\s+/).filter(word => word.length > 2);
  
  let bestScore = 0;
  
  isoCodes.forEach(isoCode => {
    let score = 0;
    
    if (isoCode.keywords && isoCode.keywords.includes(searchLower)) {
      score += 10;
    }
    
    if (isoCode.full_text && isoCode.full_text.toLowerCase().includes(searchLower)) {
      score += 8;
    }
    
    words.forEach(word => {
      if (isoCode.keywords && isoCode.keywords.includes(word)) {
        score += 1;
      }
      if (isoCode.full_text && isoCode.full_text.toLowerCase().includes(word)) {
        score += 0.5;
      }
    });
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = isoCode;
    }
  });
  
  return bestMatch;
};

const findSimilarMatches = (description, minScore = 1) => {
  if (!description || !isoCodes.length) return [];
  
  const searchText = description.toLowerCase();
  const words = searchText.split(/\s+/).filter(word => word.length > 2);
  
  const matches = [];
  
  isoCodes.forEach(isoCode => {
    let score = 0;
    
    if (isoCode.keywords && isoCode.keywords.includes(searchText)) {
      score += 10;
    }
    
    if (isoCode.full_text && isoCode.full_text.toLowerCase().includes(searchText)) {
      score += 8;
    }
    
    words.forEach(word => {
      if (isoCode.keywords && isoCode.keywords.includes(word)) {
        score += 1;
      }
      if (isoCode.full_text && isoCode.full_text.toLowerCase().includes(word)) {
        score += 0.5;
      }
    });
    
    if (score >= minScore) {
      matches.push({ ...isoCode, score });
    }
  });
  
  return matches.sort((a, b) => b.score - a.score).slice(0, 10);
};

export { loadIsoCodes, findBestMatch, findSimilarMatches };