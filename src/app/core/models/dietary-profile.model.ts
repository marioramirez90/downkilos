export type DietaryForm = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'none';

export interface IntoleranceOption {
  id: string;
  label: string;
  description?: string;
}

export const INTOLERANCE_OPTIONS: IntoleranceOption[] = [
  { id: 'lactose', label: 'Laktoseintoleranz', description: 'Milchzucker-Unverträglichkeit' },
  { id: 'fructose', label: 'Fruktoseunverträglichkeit', description: 'Fruchtzucker-Malabsorption' },
  { id: 'gluten_sensitivity', label: 'Glutenunverträglichkeit', description: 'Nicht-Zöliakie-Weizensensitivität' },
  { id: 'histamine', label: 'Histaminintoleranz', description: 'Abbauverzögerung von Histamin' },
  { id: 'other', label: 'Andere Unverträglichkeit' },
  { id: 'none', label: 'Keine bekannten Unverträglichkeiten' }
];

export interface EuAllergen {
  id: string;
  name: string;
  code: string;
  category: 'eu14' | 'fruit' | 'other';
}

export const EU_14_ALLERGENS: EuAllergen[] = [
  { id: 'gluten', name: 'Glutenhaltiges Getreide', code: 'A', category: 'eu14' },
  { id: 'crustaceans', name: 'Krebstiere', code: 'B', category: 'eu14' },
  { id: 'eggs', name: 'Eier', code: 'C', category: 'eu14' },
  { id: 'fish', name: 'Fisch', code: 'D', category: 'eu14' },
  { id: 'peanuts', name: 'Erdnüsse', code: 'E', category: 'eu14' },
  { id: 'soybeans', name: 'Sojabohnen', code: 'F', category: 'eu14' },
  { id: 'milk', name: 'Milch / Milcheiweiß', code: 'G', category: 'eu14' },
  { id: 'nuts', name: 'Schalenfrüchte / Nüsse', code: 'H', category: 'eu14' },
  { id: 'celery', name: 'Sellerie', code: 'L', category: 'eu14' },
  { id: 'mustard', name: 'Senf', code: 'M', category: 'eu14' },
  { id: 'sesame', name: 'Sesamsamen', code: 'N', category: 'eu14' },
  { id: 'sulphites', name: 'Schwefeldioxid / Sulfite', code: 'O', category: 'eu14' },
  { id: 'lupin', name: 'Lupinen', code: 'P', category: 'eu14' },
  { id: 'molluscs', name: 'Weichtiere', code: 'R', category: 'eu14' }
];

export const COMMON_FRUIT_ALLERGENS: EuAllergen[] = [
  { id: 'kiwi', name: 'Kiwi', code: 'KIWI', category: 'fruit' },
  { id: 'strawberries', name: 'Erdbeeren', code: 'STRAW', category: 'fruit' },
  { id: 'apple', name: 'Apfel', code: 'APPLE', category: 'fruit' },
  { id: 'banana', name: 'Banane', code: 'BANANA', category: 'fruit' },
  { id: 'mango', name: 'Mango', code: 'MANGO', category: 'fruit' }
];

export interface SearchSuggestionItem {
  term: string;
  category: 'Allergen' | 'Unverträglichkeit' | 'Zutat' | 'Zusatzstoff';
  clarification: string;
}

export const EXCLUSION_SUGGESTIONS_DATABASE: SearchSuggestionItem[] = [
  { term: 'Milch', category: 'Zutat', clarification: 'Allgemeine Trinkmilch' },
  { term: 'Kuhmilch', category: 'Zutat', clarification: 'Spezifisch tierische Kuhmilch' },
  { term: 'Milchprodukte', category: 'Zutat', clarification: 'Joghurt, Quark, Sahne etc.' },
  { term: 'Laktose', category: 'Unverträglichkeit', clarification: 'Milchzucker (Laktoseintoleranz)' },
  { term: 'Milcheiweiß', category: 'Allergen', clarification: 'Kasein / Molkenprotein (Medizinische Allergie)' },
  { term: 'Gluten', category: 'Allergen', clarification: 'Klebereiweiß in Weizen, Roggen, Gerste, Dinkel' },
  { term: 'Weizen', category: 'Zutat', clarification: 'Weizenmehl und -produkte' },
  { term: 'Erdnüsse', category: 'Allergen', clarification: 'Hülsenfrucht Erdnuss' },
  { term: 'Haselnüsse', category: 'Allergen', clarification: 'Schalenfrucht Haselnuss' },
  { term: 'Walnüsse', category: 'Allergen', clarification: 'Schalenfrucht Walnuss' },
  { term: 'Mandeln', category: 'Allergen', clarification: 'Schalenfrucht Mandel' },
  { term: 'Cashewkerne', category: 'Allergen', clarification: 'Schalenfrucht Cashew' },
  { term: 'Soja', category: 'Allergen', clarification: 'Sojabohnen, Sojamilch, Tofu' },
  { term: 'Eier', category: 'Allergen', clarification: 'Hühnereiweiß & Eigelb' },
  { term: 'Fisch', category: 'Allergen', clarification: 'Lachs, Forelle, Thunfisch etc.' },
  { term: 'Krebstiere', category: 'Allergen', clarification: 'Garnelen, Krabben, Hummer' },
  { term: 'Sellerie', category: 'Allergen', clarification: 'Staudensellerie & Knollensellerie' },
  { term: 'Senf', category: 'Allergen', clarification: 'Senfkörner, Tafelsenf' },
  { term: 'Sesam', category: 'Allergen', clarification: 'Sesamsaat, Tahin' },
  { term: 'Kiwi', category: 'Allergen', clarification: 'Frische Kiwi' },
  { term: 'Erdbeeren', category: 'Allergen', clarification: 'Frische & getrocknete Erdbeeren' },
  { term: 'Apfel', category: 'Allergen', clarification: 'Frischer Apfel (Birkenpollen-Kreuzallergie)' },
  { term: 'Banane', category: 'Allergen', clarification: 'Frische Bananen' },
  { term: 'Mango', category: 'Allergen', clarification: 'Frische Mango' },
  { term: 'Paprika', category: 'Zutat', clarification: 'Gemüsepaprika rot, gelb, grün' },
  { term: 'Tomaten', category: 'Zutat', clarification: 'Frische & verarbeitete Tomaten' },
  { term: 'Zwiebeln', category: 'Zutat', clarification: 'Haushaltszwiebeln, Schalotten' },
  { term: 'Knoblauch', category: 'Zutat', clarification: 'Frischer Knoblauch & Knoblauchpulver' },
  { term: 'Pilze', category: 'Zutat', clarification: 'Champignons, Waldpilze' }
];

export interface DietaryProfile {
  dietaryForm: DietaryForm;
  intolerances: string[];
  allergies: string[];
  customExcludedFoods: string[];
  dislikes: string[];
  notes?: string;
  updatedAt?: string;
}

export const DEFAULT_DIETARY_PROFILE: DietaryProfile = {
  dietaryForm: 'omnivore',
  intolerances: [],
  allergies: [],
  customExcludedFoods: [],
  dislikes: [],
  updatedAt: new Date().toISOString()
};
