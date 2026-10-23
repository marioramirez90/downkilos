import { Recipe } from './recipe.model';

export const RECIPES_DATA: Recipe[] = [
  // --- FRÜHSTÜCK (BREAKFAST) ---
  {
    id: 'rec-overnight-oats',
    title: 'Overnight Oats mit Beeren',
    mealType: 'breakfast',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 10,
    calories: 450,
    protein: 26,
    carbs: 62,
    fat: 9,
    pricePerPortion: 1.20,
    allergens: ['Gluten', 'Milch / Laktose'],
    ingredients: [
      { productId: 'netto-oats-500', name: 'Haferflocken', amount: 60, unit: 'g', portionCost: 0.11 },
      { productId: 'netto-skyr-500', name: 'Skyr Natur', amount: 150, unit: 'g', portionCost: 0.36 },
      { name: 'TK Beeren-Mix', amount: 100, unit: 'g', portionCost: 0.50 },
      { name: 'Chiasamen / Leinsamen', amount: 10, unit: 'g', portionCost: 0.15 },
      { name: 'Wasser oder Milch', amount: 80, unit: 'ml', portionCost: 0.08 }
    ],
    instructions: [
      'Haferflocken mit Skyr und etwas Flüssigkeit in einem Glas verrühren.',
      'Die Beeren und Chiasamen darüber geben.',
      'Über Nacht im Kühlschrank ziehen lassen und morgens genießen.'
    ]
  },
  {
    id: 'rec-scrambled-eggs',
    title: 'Rührei mit Tomaten & Vollkornbrot',
    mealType: 'breakfast',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 12,
    calories: 390,
    protein: 24,
    carbs: 32,
    fat: 16,
    pricePerPortion: 1.15,
    allergens: ['Ei', 'Gluten'],
    ingredients: [
      { productId: 'netto-eggs-10stk', name: 'Eier', amount: 3, unit: 'Stück', portionCost: 0.60 },
      { name: 'Kirschtomaten', amount: 80, unit: 'g', portionCost: 0.25 },
      { name: 'Vollkornbrot', amount: 1, unit: 'Scheibe', portionCost: 0.20 },
      { name: 'Rapsöl', amount: 5, unit: 'ml', portionCost: 0.10 }
    ],
    instructions: [
      'Eier in einer Schüssel verquirlen, mit Salz und Pfeffer würzen.',
      'Pfanne erhitzen, Tomaten kurz anbraten und Eimasse stocken lassen.',
      'Mit einer Scheibe frischem Vollkornbrot servieren.'
    ]
  },
  {
    id: 'rec-protein-pancakes',
    title: 'Bananen-Hafer-Pancakes',
    mealType: 'breakfast',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 15,
    calories: 420,
    protein: 20,
    carbs: 65,
    fat: 8,
    pricePerPortion: 1.35,
    allergens: ['Ei', 'Gluten'],
    ingredients: [
      { productId: 'netto-bananas-1kg', name: 'Banane', amount: 1, unit: 'Stück', portionCost: 0.25 },
      { productId: 'netto-oats-500', name: 'Haferflocken', amount: 50, unit: 'g', portionCost: 0.09 },
      { productId: 'netto-eggs-10stk', name: 'Ei', amount: 2, unit: 'Stück', portionCost: 0.40 },
      { name: 'Zimt', amount: 1, unit: 'Prise', portionCost: 0.05 }
    ],
    instructions: [
      'Banane zerdrücken, mit Eiern und Haferflocken zu einem glatten Teig pürieren.',
      'In einer beschichteten Pfanne kleine Pancakes von beiden Seiten goldgelb backen.'
    ]
  },
  {
    id: 'rec-warm-porridge',
    title: 'Warmer Apfel-Zimt-Porridge',
    mealType: 'breakfast',
    dietType: 'vegan',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 8,
    calories: 360,
    protein: 12,
    carbs: 60,
    fat: 6,
    pricePerPortion: 0.85,
    allergens: ['Gluten'],
    ingredients: [
      { productId: 'netto-oats-500', name: 'Haferflocken', amount: 60, unit: 'g', portionCost: 0.11 },
      { name: 'Apfel', amount: 1, unit: 'Stück', portionCost: 0.35 },
      { name: 'Wasser / Haferdrink', amount: 200, unit: 'ml', portionCost: 0.20 },
      { name: 'Zimt', amount: 1, unit: 'TL', portionCost: 0.05 }
    ],
    instructions: [
      'Haferflocken mit Flüssigkeit kurz aufkochen.',
      'Gewürfelten Apfel und Zimt unterrühren und warm genießen.'
    ]
  },
  {
    id: 'rec-avocado-egg-bread',
    title: 'Vollkornstulle mit Spiegelei & Tomate',
    mealType: 'breakfast',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 10,
    calories: 410,
    protein: 21,
    carbs: 34,
    fat: 18,
    pricePerPortion: 1.45,
    allergens: ['Ei', 'Gluten'],
    ingredients: [
      { name: 'Vollkornbrot', amount: 2, unit: 'Scheiben', portionCost: 0.40 },
      { productId: 'netto-eggs-10stk', name: 'Eier', amount: 2, unit: 'Stück', portionCost: 0.40 },
      { name: 'Frischkäse leicht', amount: 30, unit: 'g', portionCost: 0.25 },
      { name: 'Tomatenscheiben', amount: 60, unit: 'g', portionCost: 0.20 }
    ],
    instructions: [
      'Brot mit Frischkäse bestreichen.',
      'Spiegeleier in der Pfanne braten und mit Tomatenscheiben auf das Brot legen.'
    ]
  },

  // --- MITTAGESSEN (LUNCH) ---
  {
    id: 'rec-chicken-bowl',
    title: 'Hähnchen-Bowl mit Reis & Gemüse',
    mealType: 'lunch',
    dietType: 'omnivore',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 20,
    calories: 620,
    protein: 48,
    carbs: 68,
    fat: 12,
    pricePerPortion: 2.50,
    allergens: [],
    ingredients: [
      { productId: 'netto-chicken-400', name: 'Hähnchenbrustfilet', amount: 160, unit: 'g', portionCost: 1.20 },
      { productId: 'netto-brown-rice-500', name: 'Vollkornreis', amount: 75, unit: 'g', portionCost: 0.19 },
      { productId: 'netto-broccoli-1stk', name: 'Brokkoli', amount: 150, unit: 'g', portionCost: 0.35 },
      { productId: 'netto-carrots-1kg', name: 'Karotten', amount: 100, unit: 'g', portionCost: 0.10 },
      { name: 'Sojasauce & Sesam', amount: 15, unit: 'ml', portionCost: 0.25 }
    ],
    instructions: [
      'Vollkornreis nach Packungsanleitung kochen.',
      'Brokkoli und Karotten dämpfen oder anbraten.',
      'Hähnchenbrust in Streifen schneiden und goldbraun anbraten.',
      'Alles in einer Schale anrichten und mit etwas Sojasauce beträufeln.'
    ]
  },
  {
    id: 'rec-chickpea-feta-salad',
    title: 'Bunter Kichererbsen-Salat mit Feta',
    mealType: 'lunch',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 12,
    calories: 520,
    protein: 26,
    carbs: 48,
    fat: 22,
    pricePerPortion: 1.85,
    allergens: ['Milch / Laktose'],
    ingredients: [
      { name: 'Kichererbsen (Dose)', amount: 200, unit: 'g', portionCost: 0.65 },
      { productId: 'netto-paprika-red-2stk', name: 'Rote Paprika', amount: 80, unit: 'g', portionCost: 0.45 },
      { name: 'Feta light', amount: 60, unit: 'g', portionCost: 0.50 },
      { name: 'Gurke', amount: 80, unit: 'g', portionCost: 0.25 }
    ],
    instructions: [
      'Kichererbsen abspülen und abtropfen lassen.',
      'Paprika, Gurke und Feta in Würfel schneiden.',
      'Mit Zitronensaft, Kräutern und Olivenöl marinieren.'
    ]
  },
  {
    id: 'rec-tuna-pasta',
    title: 'Vollkorn-Pasta mit Thunfisch & Tomate',
    mealType: 'lunch',
    dietType: 'omnivore',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 15,
    calories: 580,
    protein: 42,
    carbs: 72,
    fat: 9,
    pricePerPortion: 1.95,
    allergens: ['Fisch', 'Gluten'],
    ingredients: [
      { name: 'Vollkornnudeln', amount: 80, unit: 'g', portionCost: 0.30 },
      { name: 'Thunfisch im eigenen Saft', amount: 120, unit: 'g', portionCost: 1.10 },
      { name: 'Gehackte Tomaten (Dose)', amount: 150, unit: 'g', portionCost: 0.35 },
      { name: 'Knoblauch & Kräuter', amount: 10, unit: 'g', portionCost: 0.20 }
    ],
    instructions: [
      'Nudeln al dente kochen.',
      'Tomaten mit Knoblauch kurz einkochen, Thunfisch unterheben und mit den Nudeln vermengen.'
    ]
  },
  {
    id: 'rec-tofu-quinoa-pan',
    title: 'Knusprige Tofu-Gemüsepfanne',
    mealType: 'lunch',
    dietType: 'vegan',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 18,
    calories: 490,
    protein: 28,
    carbs: 52,
    fat: 16,
    pricePerPortion: 1.80,
    allergens: ['Soja'],
    ingredients: [
      { name: 'Naturtofu', amount: 150, unit: 'g', portionCost: 0.85 },
      { productId: 'netto-broccoli-1stk', name: 'Brokkoli', amount: 120, unit: 'g', portionCost: 0.30 },
      { productId: 'netto-paprika-red-2stk', name: 'Rote Paprika', amount: 80, unit: 'g', portionCost: 0.45 },
      { productId: 'netto-brown-rice-500', name: 'Vollkornreis', amount: 60, unit: 'g', portionCost: 0.15 }
    ],
    instructions: [
      'Tofu würfeln und in der Pfanne knusprig anbraten.',
      'Gemüse und Reis dazugeben und mit Sojasauce abschmecken.'
    ]
  },
  {
    id: 'rec-turkey-sheet-pan',
    title: 'Hähnchen mit bunten Ofengemüse',
    mealType: 'lunch',
    dietType: 'omnivore',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 25,
    calories: 510,
    protein: 44,
    carbs: 42,
    fat: 14,
    pricePerPortion: 2.30,
    allergens: [],
    ingredients: [
      { productId: 'netto-chicken-400', name: 'Hähnchenbrustfilet', amount: 150, unit: 'g', portionCost: 1.15 },
      { productId: 'netto-carrots-1kg', name: 'Karotten', amount: 120, unit: 'g', portionCost: 0.12 },
      { productId: 'netto-paprika-red-2stk', name: 'Paprika', amount: 80, unit: 'g', portionCost: 0.45 },
      { name: 'Kartoffeln', amount: 150, unit: 'g', portionCost: 0.25 }
    ],
    instructions: [
      'Gemüse und Fleisch schneiden, mit 1 TL Olivenöl und Paprikapulver marinieren.',
      'Auf dem Backblech bei 200 °C ca. 20 Minuten garen.'
    ]
  },

  // --- SNACK ---
  {
    id: 'rec-skyr-snack',
    title: 'Skyr mit Banane und Nüssen',
    mealType: 'snack',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/skyr-snack.jpg',
    prepTimeMinutes: 5,
    calories: 250,
    protein: 24,
    carbs: 26,
    fat: 5,
    pricePerPortion: 0.80,
    allergens: ['Milch / Laktose', 'Schalenfrüchte'],
    ingredients: [
      { productId: 'netto-skyr-500', name: 'Skyr Natur', amount: 180, unit: 'g', portionCost: 0.43 },
      { productId: 'netto-bananas-1kg', name: 'Banane', amount: 1, unit: 'halbe', portionCost: 0.15 },
      { name: 'Walnusskerne', amount: 12, unit: 'g', portionCost: 0.22 }
    ],
    instructions: [
      'Skyr in eine Schale geben.',
      'Banane in Scheiben schneiden und mit den Nüssen darübergeben.'
    ]
  },
  {
    id: 'rec-apple-peanut',
    title: 'Apfelscheiben mit Erdnussmus',
    mealType: 'snack',
    dietType: 'vegan',
    imageUrl: 'images/meals/skyr-snack.jpg',
    prepTimeMinutes: 3,
    calories: 190,
    protein: 6,
    carbs: 22,
    fat: 9,
    pricePerPortion: 0.65,
    allergens: ['Erdnüsse'],
    ingredients: [
      { name: 'Apfel', amount: 1, unit: 'Stück', portionCost: 0.35 },
      { name: 'Erdnussmus 100%', amount: 15, unit: 'g', portionCost: 0.30 }
    ],
    instructions: [
      'Apfel in Spalten schneiden und mit Erdnussmus dippen.'
    ]
  },
  {
    id: 'rec-carrot-dip',
    title: 'Karottensticks mit Kräuterquark',
    mealType: 'snack',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/skyr-snack.jpg',
    prepTimeMinutes: 5,
    calories: 140,
    protein: 15,
    carbs: 14,
    fat: 1,
    pricePerPortion: 0.55,
    allergens: ['Milch / Laktose'],
    ingredients: [
      { productId: 'netto-carrots-1kg', name: 'Karotten', amount: 150, unit: 'g', portionCost: 0.15 },
      { name: 'Magerquark', amount: 120, unit: 'g', portionCost: 0.35 },
      { name: 'Kräuter & Salz', amount: 5, unit: 'g', portionCost: 0.05 }
    ],
    instructions: [
      'Magerquark mit etwas Mineralwasser und Kräutern cremig rühren.',
      'Karotten schälen, in Stifte schneiden und dippen.'
    ]
  },
  {
    id: 'rec-nut-mix',
    title: 'Handvoll Mandeln & Nüsse',
    mealType: 'snack',
    dietType: 'vegan',
    imageUrl: 'images/meals/skyr-snack.jpg',
    prepTimeMinutes: 1,
    calories: 210,
    protein: 7,
    carbs: 5,
    fat: 18,
    pricePerPortion: 0.85,
    allergens: ['Schalenfrüchte'],
    ingredients: [
      { name: 'Nuss-Mix naturbelassen', amount: 35, unit: 'g', portionCost: 0.85 }
    ],
    instructions: [
      'Ideal als energiereicher Snack für zwischendurch.'
    ]
  },

  // --- ABENDESSEN (DINNER) ---
  {
    id: 'rec-lentil-curry',
    title: 'Linsen-Curry mit Vollkornreis',
    mealType: 'dinner',
    dietType: 'vegan',
    imageUrl: 'images/meals/lentil-curry.jpg',
    prepTimeMinutes: 25,
    calories: 480,
    protein: 22,
    carbs: 72,
    fat: 7,
    pricePerPortion: 1.90,
    allergens: [],
    ingredients: [
      { productId: 'netto-red-lentils-500', name: 'Rote Linsen', amount: 80, unit: 'g', portionCost: 0.21 },
      { productId: 'netto-brown-rice-500', name: 'Vollkornreis', amount: 65, unit: 'g', portionCost: 0.17 },
      { name: 'Kokosmilch light', amount: 100, unit: 'ml', portionCost: 0.50 },
      { name: 'Gehackte Tomaten', amount: 100, unit: 'g', portionCost: 0.25 },
      { name: 'Currypulver & Ingwer', amount: 10, unit: 'g', portionCost: 0.20 }
    ],
    instructions: [
      'Linsen mit gehackten Tomaten, Curry und Kokosmilch ca. 15 Minuten sanft köcheln.',
      'Mit gekochtem Vollkornreis und frischem Koriander servieren.'
    ]
  },
  {
    id: 'rec-baked-feta',
    title: 'Ofen-Feta mit Tomaten & Paprika',
    mealType: 'dinner',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/lentil-curry.jpg',
    prepTimeMinutes: 20,
    calories: 490,
    protein: 26,
    carbs: 18,
    fat: 32,
    pricePerPortion: 2.10,
    allergens: ['Milch / Laktose'],
    ingredients: [
      { name: 'Feta light', amount: 120, unit: 'g', portionCost: 1.10 },
      { productId: 'netto-paprika-red-2stk', name: 'Paprika', amount: 100, unit: 'g', portionCost: 0.55 },
      { name: 'Kirschtomaten', amount: 100, unit: 'g', portionCost: 0.35 },
      { name: 'Olivenöl & Oregano', amount: 10, unit: 'ml', portionCost: 0.10 }
    ],
    instructions: [
      'Feta mit Gemüse in eine Auflaufform geben.',
      'Mit Olivenöl und Oregano beträufeln und bei 200 °C ca. 18 Minuten backen.'
    ]
  },
  {
    id: 'rec-veggie-stew',
    title: 'Bunter Gemüseeintopf mit Kartoffeln',
    mealType: 'dinner',
    dietType: 'vegan',
    imageUrl: 'images/meals/lentil-curry.jpg',
    prepTimeMinutes: 25,
    calories: 380,
    protein: 14,
    carbs: 65,
    fat: 5,
    pricePerPortion: 1.30,
    allergens: [],
    ingredients: [
      { name: 'Kartoffeln', amount: 200, unit: 'g', portionCost: 0.30 },
      { productId: 'netto-carrots-1kg', name: 'Karotten', amount: 100, unit: 'g', portionCost: 0.10 },
      { productId: 'netto-broccoli-1stk', name: 'Brokkoli', amount: 100, unit: 'g', portionCost: 0.22 },
      { name: 'Gemüsebrühe', amount: 350, unit: 'ml', portionCost: 0.15 }
    ],
    instructions: [
      'Kartoffeln und Gemüse würfeln.',
      'In Brühe ca. 20 Minuten weich köcheln und nach Wunsch leicht anstampfen.'
    ]
  },
  {
    id: 'rec-tuna-salad',
    title: 'Protein-Thunfisch-Salat mit Ei',
    mealType: 'dinner',
    dietType: 'omnivore',
    imageUrl: 'images/meals/lentil-curry.jpg',
    prepTimeMinutes: 12,
    calories: 430,
    protein: 46,
    carbs: 12,
    fat: 21,
    pricePerPortion: 1.95,
    allergens: ['Fisch', 'Ei'],
    ingredients: [
      { name: 'Thunfisch im eigenen Saft', amount: 140, unit: 'g', portionCost: 1.25 },
      { productId: 'netto-eggs-10stk', name: 'Gekochtes Ei', amount: 2, unit: 'Stück', portionCost: 0.40 },
      { name: 'Gurke & Blattsalat', amount: 150, unit: 'g', portionCost: 0.30 }
    ],
    instructions: [
      'Salat und Gurke waschen und schneiden.',
      'Thunfisch und halbierte gekochte Eier darauf anrichten.'
    ]
  },
  {
    id: 'rec-chili-sin-carne',
    title: 'Chili sin Carne mit Kidneybohnen',
    mealType: 'dinner',
    dietType: 'vegan',
    imageUrl: 'images/meals/lentil-curry.jpg',
    prepTimeMinutes: 20,
    calories: 460,
    protein: 21,
    carbs: 70,
    fat: 6,
    pricePerPortion: 1.40,
    allergens: [],
    ingredients: [
      { name: 'Kidneybohnen (Dose)', amount: 180, unit: 'g', portionCost: 0.50 },
      { name: 'Mais (Dose)', amount: 80, unit: 'g', portionCost: 0.30 },
      { name: 'Gehackte Tomaten', amount: 150, unit: 'g', portionCost: 0.35 },
      { productId: 'netto-brown-rice-500', name: 'Vollkornreis', amount: 50, unit: 'g', portionCost: 0.13 }
    ],
    instructions: [
      'Bohnen und Mais mit Tomatensauce und Chilipulver ca. 12 Minuten kochen.',
      'Mit Reis servieren.'
    ]
  }
];
