export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  number: number;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
}

export const QUIZ_TITLE = 'CABERNET SAUVIGNON WINE MAKING PROCESS CHALLENGE';

export const QUIZ_SCENARIO =
  'Make an AOC label Premium Cabernet Sauvignon majority blended red wine in France. It should have complex flavors of Primary and Secondary (oak).';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    number: 1,
    prompt: 'Select the most suitable region to plant this grape:',
    options: [
      { id: 'A', label: 'Burgundy' },
      { id: 'B', label: 'Hermitage' },
      { id: 'C', label: 'Bordeaux' },
      { id: 'D', label: 'Alsace' },
    ],
    correctOptionId: 'C',
  },
  {
    number: 2,
    prompt: 'Select the most suitable village for premium wine for this grape:',
    options: [
      { id: 'A', label: 'Pomerol' },
      { id: 'B', label: 'Pauillac' },
      { id: 'C', label: 'Saint-Emilion' },
      { id: 'D', label: 'Sauternes' },
    ],
    correctOptionId: 'B',
  },
  {
    number: 3,
    prompt: 'Which other red wine grape would you plant to blend in with this grape?',
    options: [
      { id: 'A', label: 'Grenache' },
      { id: 'B', label: 'Syrah' },
      { id: 'C', label: 'Merlot' },
      { id: 'D', label: 'Pinot Noir' },
    ],
    correctOptionId: 'C',
  },
  {
    number: 4,
    prompt: 'Which yield would you choose?',
    options: [
      { id: 'A', label: 'Low Yield' },
      { id: 'B', label: 'High Yield' },
    ],
    correctOptionId: 'A',
  },
  {
    number: 5,
    prompt: 'After harvesting what would you do at the winery?',
    options: [
      { id: 'A', label: 'Crush Cabernet Sauvignon and Merlot mixed together' },
      { id: 'B', label: 'Crush Cabernet Sauvignon and Merlot separately' },
    ],
    correctOptionId: 'B',
  },
  {
    number: 6,
    prompt: 'After crushing what would you do next?',
    options: [
      { id: 'A', label: 'Ferment Cabernet Sauvignon separately and Merlot Separately' },
      { id: 'B', label: 'Mix the Cabernet Sauvignon and Merlot juice to co-ferment together.' },
    ],
    correctOptionId: 'A',
  },
  {
    number: 7,
    prompt: 'When would the fermentation complete?',
    options: [
      { id: 'A', label: 'Within 24 hours' },
      { id: 'B', label: 'Between 1 to 4 days' },
      { id: 'C', label: 'Between 7 to 21 Days' },
      { id: 'D', label: 'Between 30 to 60 days' },
    ],
    correctOptionId: 'C',
  },
  {
    number: 8,
    prompt: 'After fermentation what would you do with the wine?',
    options: [
      { id: 'A', label: 'Drain the wine that is purely liquid away' },
      { id: 'B', label: 'Bottle the wine' },
      { id: 'C', label: 'Transfer the wine into oak barrel' },
      { id: 'D', label: 'Keep the wine in stainless steel tank' },
    ],
    correctOptionId: 'A',
  },
  {
    number: 9,
    prompt: 'What would you do next with the balance skins?',
    options: [
      { id: 'A', label: 'Throw the skins into the vineyard.' },
      { id: 'B', label: 'Press the skins to extract the rest of the wine from the skin.' },
    ],
    correctOptionId: 'B',
  },
  {
    number: 10,
    prompt: 'What would you do with the wine from the pressed skin?',
    options: [
      { id: 'A', label: 'Mix everything with the drained wine into the oak barrel.' },
      { id: 'B', label: 'Mix half with the drained wine into the oak barrel.' },
      { id: 'C', label: 'Keep separately in oak barrel from the drained wine.' },
    ],
    correctOptionId: 'C',
  },
  {
    number: 11,
    prompt:
      'Would you blend together the Cabernet Sauvignon and Merlot together before putting them into the oak barrel for maturation?',
    options: [
      { id: 'A', label: 'Yes – blend together and mature in same oak barrels.' },
      { id: 'B', label: 'No – Keep them in separate oak barrels.' },
    ],
    correctOptionId: 'B',
  },
  {
    number: 12,
    prompt: 'How long would you mature the wine in the oak barrels?',
    options: [
      { id: 'A', label: '3-6 months' },
      { id: 'B', label: '12 – 24 months' },
      { id: 'C', label: '24-48 months' },
      { id: 'D', label: '48-60 months' },
    ],
    correctOptionId: 'B',
  },
  {
    number: 13,
    prompt: 'After Maturation has completed, what would you do next?',
    options: [
      { id: 'A', label: 'Bottle each barrel separately' },
      { id: 'B', label: 'Bottle only the barrels that taste good.' },
      { id: 'C', label: 'Taste and Blend More Cabernet Sauvignon with some Merlot' },
    ],
    correctOptionId: 'C',
  },
  {
    number: 14,
    prompt: 'What would you do with the pressed wine from the skin?',
    options: [
      { id: 'A', label: 'Taste to decide if any portion needs to be added to the final blend' },
      { id: 'B', label: 'Bottle separately to sell as a thick, tannic red wine' },
    ],
    correctOptionId: 'A',
  },
  {
    number: 15,
    prompt: 'After deciding on the blend portions (recipe), what would you likely do next?',
    options: [
      { id: 'A', label: 'Leave all the wines to continue maturing in the barrel' },
      { id: 'B', label: 'Bottle the wines according to the portion (recipe) confirmed' },
    ],
    correctOptionId: 'B',
  },
];
