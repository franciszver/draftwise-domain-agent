// Comprehensive country and region data

export interface Country {
  code: string;
  name: string;
  regions?: string[];
}

export const countries: Country[] = [
  // North America
  {
    code: 'US',
    name: 'United States',
    regions: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
      'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
      'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
      'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
      'West Virginia', 'Wisconsin', 'Wyoming'
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    regions: [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
      'Newfoundland and Labrador', 'Nova Scotia', 'Ontario',
      'Prince Edward Island', 'Quebec', 'Saskatchewan',
      'Northwest Territories', 'Nunavut', 'Yukon'
    ],
  },
  { code: 'MX', name: 'Mexico', regions: ['Mexico City', 'Nuevo Leon', 'Jalisco', 'Baja California'] },

  // Europe - EU
  {
    code: 'DE',
    name: 'Germany',
    regions: [
      'Baden-Wurttemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
      'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern',
      'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland',
      'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
    ],
  },
  {
    code: 'FR',
    name: 'France',
    regions: ['Ile-de-France', 'Provence-Alpes-Cote d\'Azur', 'Auvergne-Rhone-Alpes', 'Nouvelle-Aquitaine', 'Occitanie'],
  },
  {
    code: 'IT',
    name: 'Italy',
    regions: ['Lombardy', 'Lazio', 'Veneto', 'Piedmont', 'Emilia-Romagna', 'Tuscany'],
  },
  {
    code: 'ES',
    name: 'Spain',
    regions: ['Madrid', 'Catalonia', 'Andalusia', 'Valencia', 'Basque Country'],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    regions: ['North Holland', 'South Holland', 'Utrecht', 'North Brabant'],
  },
  {
    code: 'BE',
    name: 'Belgium',
    regions: ['Brussels', 'Flanders', 'Wallonia'],
  },
  {
    code: 'AT',
    name: 'Austria',
    regions: ['Vienna', 'Lower Austria', 'Upper Austria', 'Styria'],
  },
  {
    code: 'PL',
    name: 'Poland',
    regions: ['Mazovia', 'Silesia', 'Greater Poland', 'Lesser Poland'],
  },
  { code: 'SE', name: 'Sweden', regions: ['Stockholm', 'Vastra Gotaland', 'Skane'] },
  { code: 'DK', name: 'Denmark', regions: ['Copenhagen', 'Central Denmark', 'North Denmark'] },
  { code: 'FI', name: 'Finland', regions: ['Uusimaa', 'Southwest Finland', 'Pirkanmaa'] },
  { code: 'IE', name: 'Ireland', regions: ['Dublin', 'Cork', 'Galway'] },
  { code: 'PT', name: 'Portugal', regions: ['Lisbon', 'Porto', 'Algarve'] },
  { code: 'GR', name: 'Greece', regions: ['Attica', 'Central Macedonia', 'Crete'] },
  { code: 'CZ', name: 'Czech Republic', regions: ['Prague', 'Central Bohemia', 'Moravia-Silesia'] },
  { code: 'RO', name: 'Romania', regions: ['Bucharest', 'Cluj', 'Timis'] },
  { code: 'HU', name: 'Hungary', regions: ['Budapest', 'Pest', 'Bacs-Kiskun'] },

  // Europe - Non-EU
  {
    code: 'GB',
    name: 'United Kingdom',
    regions: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'London', 'Manchester', 'Birmingham'],
  },
  { code: 'CH', name: 'Switzerland', regions: ['Zurich', 'Geneva', 'Basel', 'Bern'] },
  { code: 'NO', name: 'Norway', regions: ['Oslo', 'Bergen', 'Trondheim'] },

  // Asia Pacific
  { code: 'JP', name: 'Japan', regions: ['Tokyo', 'Osaka', 'Kanagawa', 'Aichi'] },
  { code: 'KR', name: 'South Korea', regions: ['Seoul', 'Busan', 'Incheon', 'Gyeonggi'] },
  { code: 'CN', name: 'China', regions: ['Beijing', 'Shanghai', 'Guangdong', 'Zhejiang', 'Jiangsu'] },
  { code: 'SG', name: 'Singapore', regions: ['Central Region', 'East Region', 'West Region'] },
  { code: 'AU', name: 'Australia', regions: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia'] },
  { code: 'NZ', name: 'New Zealand', regions: ['Auckland', 'Wellington', 'Canterbury'] },
  { code: 'IN', name: 'India', regions: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi NCR'] },
  { code: 'HK', name: 'Hong Kong', regions: ['Hong Kong Island', 'Kowloon', 'New Territories'] },
  { code: 'TW', name: 'Taiwan', regions: ['Taipei', 'New Taipei', 'Taichung', 'Kaohsiung'] },

  // Middle East
  { code: 'AE', name: 'United Arab Emirates', regions: ['Dubai', 'Abu Dhabi', 'Sharjah'] },
  { code: 'SA', name: 'Saudi Arabia', regions: ['Riyadh', 'Makkah', 'Eastern Province'] },
  { code: 'IL', name: 'Israel', regions: ['Tel Aviv', 'Jerusalem', 'Haifa'] },

  // South America
  { code: 'BR', name: 'Brazil', regions: ['Sao Paulo', 'Rio de Janeiro', 'Minas Gerais'] },
  { code: 'AR', name: 'Argentina', regions: ['Buenos Aires', 'Cordoba', 'Santa Fe'] },
  { code: 'CL', name: 'Chile', regions: ['Santiago Metropolitan', 'Valparaiso', 'Biobio'] },
  { code: 'CO', name: 'Colombia', regions: ['Bogota', 'Antioquia', 'Valle del Cauca'] },

  // Africa
  { code: 'ZA', name: 'South Africa', regions: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'] },
  { code: 'EG', name: 'Egypt', regions: ['Cairo', 'Alexandria', 'Giza'] },
  { code: 'NG', name: 'Nigeria', regions: ['Lagos', 'Abuja', 'Rivers'] },
  { code: 'KE', name: 'Kenya', regions: ['Nairobi', 'Mombasa', 'Kisumu'] },
];

export function getRegionsForCountry(countryName: string): string[] {
  const country = countries.find((c) => c.name === countryName);
  return country?.regions || [];
}

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

// Map jurisdiction to regulatory framework
export function getJurisdictionFramework(country: string): 'us' | 'eu' | 'uk' | 'apac' | 'other' {
  const euCountries = [
    'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria',
    'Poland', 'Sweden', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Greece',
    'Czech Republic', 'Romania', 'Hungary'
  ];
  
  if (country === 'United States') return 'us';
  if (country === 'United Kingdom') return 'uk';
  if (euCountries.includes(country)) return 'eu';
  if (['Japan', 'South Korea', 'China', 'Singapore', 'Australia', 'New Zealand', 'India', 'Hong Kong', 'Taiwan'].includes(country)) return 'apac';
  return 'other';
}


