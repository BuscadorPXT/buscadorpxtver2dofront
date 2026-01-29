

export const PRODUCT_COLORS = {

  'iphone 11': ['purple', 'green', 'yellow', 'black', 'white', 'red'],
  'iphone 11 pro': ['space gray', 'silver', 'gold', 'midnight green'],
  'iphone 11 pro max': ['space gray', 'silver', 'gold', 'midnight green'],
  
  'iphone 12': ['black', 'purple', 'green', 'blue', 'white', 'red'],
  'iphone 12 pro': ['pacific blue', 'gold', 'silver', 'graphite'],
  'iphone 12 pro max': ['pacific blue', 'gold', 'silver', 'graphite'],
  
  'iphone 13': ['midnight', 'starlight', 'pink', 'blue', 'green', 'red'],
  'iphone 13 pro': ['sierra blue', 'silver', 'gold', 'graphite', 'alpine green'],
  'iphone 13 pro max': ['sierra blue', 'silver', 'gold', 'graphite', 'alpine green'],
  
  'iphone 14': ['purple', 'blue', 'midnight', 'starlight', 'red', 'yellow'],
  'iphone 14 pro': ['deep purple', 'gold', 'silver', 'space black'],
  'iphone 14 pro max': ['deep purple', 'gold', 'silver', 'space black'],
  
  'iphone 15': ['black', 'starlight', 'pink', 'blue', 'green', 'red', 'yellow'],
  'iphone 15 plus': ['black', 'starlight', 'pink', 'blue', 'green', 'red', 'yellow'],
  'iphone 15 pro': ['black titanium', 'white titanium', 'natural titanium', 'blue titanium'],
  'iphone 15 pro max': ['black titanium', 'white titanium', 'natural titanium', 'blue titanium'],
  
  'iphone 16e': ['black', 'white'],
  'iphone 16': ['black', 'white', 'pink', 'ultramarine', 'teal'],
  'iphone 16 plus': ['black', 'white', 'pink', 'ultramarine', 'teal'],
  'iphone 16 pro': ['black titanium', 'white titanium', 'natural titanium', 'desert titanium'],
  'iphone 16 pro max': ['black titanium', 'white titanium', 'natural titanium', 'desert titanium'],
  
  'iphone 17': ['black', 'white', 'lavender', 'mist blue', 'sage'],
  'iphone 17 pro': ['cosmic orange', 'deep blue', 'silver'],
  'iphone 17 pro max': ['cosmic orange', 'deep blue', 'silver'],
  'iphone 17 air': ['sky blue', 'light gold', 'cloud white', 'space black'],

  'ipad 9': ['silver', 'space gray'],
  'ipad 10': ['silver', 'blue', 'pink', 'yellow'],
  'ipad 11': ['silver', 'blue', 'pink', 'yellow'],
  
  'ipad mini 6': ['space gray', 'pink', 'purple', 'starlight'],
  'ipad mini 7': ['space gray', 'blue', 'purple', 'starlight'],
  'ipad mini 7 a17 pro': ['space gray', 'blue', 'purple', 'starlight'],
  
  'ipad air 5': ['space gray', 'blue', 'pink', 'purple', 'starlight'],
  'ipad air m1': ['space gray', 'blue', 'pink', 'purple', 'starlight'],
  'ipad air m2': ['space gray', 'blue', 'purple', 'starlight'],
  'ipad air m3': ['space gray', 'blue', 'purple', 'starlight'],
  
  'ipad pro 5': ['space gray', 'silver'],
  'ipad pro 5 12.9': ['space gray', 'silver'],
  'ipad pro m4': ['space black', 'silver'],

  'macbook air m1': ['space gray', 'silver', 'gold'],
  'macbook air m2': ['starlight', 'midnight', 'space gray', 'silver'],
  'macbook air m3': ['starlight', 'midnight', 'space gray', 'silver'],
  'macbook air m4': ['starlight', 'midnight', 'sky blue', 'silver'],
  
  'macbook pro m3': ['space gray', 'silver'],
  'macbook pro m3 pro': ['space black', 'silver'],
  'macbook pro m3 max': ['space black', 'silver'],
  'macbook pro m4': ['space black', 'silver'],

  'apple watch se': ['midnight', 'silver', 'starlight'],
  'apple watch se 2': ['midnight', 'silver', 'starlight'],
  'apple watch se 3': ['midnight', 'starlight'],
  
  'apple watch s9': ['midnight', 'pink', 'starlight', 'silver', 'red'],
  'apple watch s10': ['jet black', 'silver', 'rose gold'],
  'apple watch s11': ['jet black', 'silver', 'rose gold', 'space gray'],

  'airpods max': ['blue', 'purple', 'midnight', 'starlight', 'orange'],
  'magic mouse 2': ['black', 'white'],
  'magic mouse 3': ['black', 'white'],
};

export const formatColorName = (colorName) => {
  if (!colorName) return '';
  
  return colorName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const normalizeColorForDB = (colorName) => {
  if (!colorName) return '';
  return colorName.toLowerCase().trim();
};

export const normalizeProductName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[®™]/g, '')
    .replace(/\bcpo\b/gi, '')
    .replace(/\b\d+gb\b/gi, '')
    .replace(/\b\d+tb\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getOfficialColors = (productName) => {
  if (!productName) return null;
  
  const normalized = normalizeProductName(productName);

  if (PRODUCT_COLORS[normalized]) {
    return PRODUCT_COLORS[normalized].map(formatColorName);
  }

  const matchingKey = Object.keys(PRODUCT_COLORS).find(key => {

    if (normalized.includes(key)) return true;

    if (key.includes(normalized)) return true;
    
    return false;
  });
  
  return matchingKey ? PRODUCT_COLORS[matchingKey].map(formatColorName) : null;
};

export const categorizeColors = (productName, availableColors = []) => {
  const officialColors = getOfficialColors(productName);
  
  if (!officialColors) {

    return {
      available: availableColors.map(formatColorName),
      unavailable: [],
      hasOfficialData: false
    };
  }

  const availableColorMap = new Map();
  availableColors.forEach(color => {
    const normalized = normalizeProductName(color);
    availableColorMap.set(normalized, formatColorName(color));
  });
  
  const available = [];
  const unavailable = [];
  
  officialColors.forEach(formattedColor => {
    const normalizedOfficial = normalizeProductName(formattedColor);

    const matchingAvailable = availableColorMap.get(normalizedOfficial);
    
    if (matchingAvailable) {
      available.push(matchingAvailable);
    } else {
      unavailable.push(formattedColor);
    }
  });
  
  return {
    available,
    unavailable,
    hasOfficialData: true
  };
};
