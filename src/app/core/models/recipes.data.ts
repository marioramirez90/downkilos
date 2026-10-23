import { Recipe } from './recipe.model';

/**
 * Verifizierte Down-Kilos-Rezeptdatenbank mit echten Netto-Produktverknüpfungen,
 * vollständigen Kochanleitungen und getrennten Kostenberechnungen:
 * - pricePerPortion: Rechnerischer Portionspreis der verbrauchten Mengen
 * - fullPackageCost: Tatsächlicher Einkaufspreis der vollständigen Packungen bei Netto
 */
export const RECIPES_DATA: Recipe[] = [
  // =========================================================================
  // 1. FRÜHSTÜCK (BREAKFAST)
  // =========================================================================
  {
    id: 'rec-scrambled-eggs',
    title: 'Cremiges Rührei mit Tomaten & Rapsöl',
    subtitle: 'Klassisches eiweißreiches Frühstück aus frischen Netto-Zutaten',
    mealType: 'breakfast',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 5,
    cookTimeMinutes: 6,
    difficulty: 'Einfach',
    calories: 275,
    protein: 20.5,
    carbs: 4.2,
    fat: 19.8,
    pricePerPortion: 0.94, // Anteilige Zutaten: 3 Eier (0,60 €) + 100g Tomaten (0,30 €) + 5g Rapsöl (0,02 €) + Gewürze (0,02 €)
    fullPackageCost: 5.47, // Volle Packungen bei Netto: 10er Eier (1,99 €) + 500g Tomaten (1,49 €) + 500ml Öl (1,99 €)
    defaultServings: 1,
    allergens: ['Ei'],
    ingredients: [
      {
        productId: 'netto-eggs-10stk',
        name: 'Frische Eier (Bodenhaltung Klasse M)',
        amount: 3,
        unit: 'Stück',
        portionCost: 0.60,
        packageSize: '10 Stück',
        packagePrice: 1.99,
        packagesNeeded: 1,
        notes: 'ca. 160g Rohgewicht'
      },
      {
        productId: 'netto-tomatoes-500',
        name: 'Frische Rispentomaten',
        amount: 100,
        unit: 'g',
        portionCost: 0.30,
        packageSize: '500 g Schale',
        packagePrice: 1.49,
        packagesNeeded: 1,
        notes: 'gewaschen und gewürfelt'
      },
      {
        productId: 'netto-rapeseed-oil-500',
        name: 'Reines Rapsöl nativ',
        amount: 5,
        unit: 'ml',
        portionCost: 0.02,
        packageSize: '500 ml Flasche',
        packagePrice: 1.99,
        packagesNeeded: 1,
        notes: 'ca. 1 TL zum Anbraten'
      },
      {
        name: 'Jodsalz & schwarzer Pfeffer',
        amount: 1,
        unit: 'Prise',
        portionCost: 0.02,
        packageSize: 'Haushaltsvorrat',
        packagePrice: 0.39,
        packagesNeeded: 0,
        notes: 'nach Geschmack'
      }
    ],
    stepInstructions: [
      'Schritt 1: Wasche die Rispentomaten gründlich unter fließendem kaltem Wasser und schneide sie mit einem scharfen Messer in mundgerechte, ca. 1 cm große Würfel.',
      'Schritt 2: Schlage die 3 Eier vorsichtig an einer Kante auf und gib sie in eine kleine Rührschüssel. Mit einer Prise Salz und frisch gemahlenem Pfeffer würzen und mit einer Gabel ca. 20 Sekunden gleichmäßig verquirlen.',
      'Schritt 3: Erhitze 1 TL Rapsöl in einer beschichteten Pfanne bei mittlerer Stufe (z.B. Stufe 5 von 9). Das Öl sollte warm sein, aber nicht rauchen.',
      'Schritt 4: Gib zuerst die Tomatenwürfel in die Pfanne und brate sie für 1 bis 2 Minuten sanft an, bis sie ihr fruchtiges Aroma entfalten.',
      'Schritt 5: Gieße die verquirlte Eimasse gleichmäßig über die Tomaten. Reduziere die Hitze leicht und schiebe die stockende Eimasse mit einem Holz- oder Silikonschaber langsam vom Pfannenrand zur Mitte.',
      'Schritt 6: Sobald das Rührei gestockt, aber noch wunderbar saftig und cremig glänzend ist (nach ca. 2 bis 3 Minuten), sofort von der Herdplatte nehmen und warm servieren.'
    ],
    mealPrepTips: 'Rührei schmeckt frisch zubereitet am cremigsten. Es kann gekühlt bis zum Nachmittag als kalter Brotbelag verwendet werden.',
    storageTips: 'Gekochte Ei-Reste luftdicht im Kühlschrank aufbewahren und innerhalb von 24 Stunden verzehren.'
  },
  {
    id: 'rec-overnight-oats',
    title: 'Overnight Oats mit Banane & Skyr',
    subtitle: 'Nährstoffreiches Vorbereitungs-Frühstück mit langanhaltender Sättigung',
    mealType: 'breakfast',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    difficulty: 'Einfach',
    calories: 420,
    protein: 25.5,
    carbs: 64.0,
    fat: 5.2,
    pricePerPortion: 0.72,
    fullPackageCost: 3.87, // Haferflocken (0,79 €) + Skyr (1,39 €) + Bananen (1,69 €)
    defaultServings: 1,
    allergens: ['Gluten', 'Milch / Laktose'],
    ingredients: [
      {
        productId: 'netto-oats-500',
        name: 'Zarte Haferflocken',
        amount: 50,
        unit: 'g',
        portionCost: 0.08,
        packageSize: '500 g',
        packagePrice: 0.79,
        packagesNeeded: 1
      },
      {
        productId: 'netto-skyr-500',
        name: 'Skyr Natur traditionell',
        amount: 150,
        unit: 'g',
        portionCost: 0.42,
        packageSize: '500 g Becher',
        packagePrice: 1.39,
        packagesNeeded: 1
      },
      {
        productId: 'netto-bananas-1kg',
        name: 'Bio Banane',
        amount: 1,
        unit: 'Stück (ca. 120 g essbar)',
        portionCost: 0.20,
        packageSize: '1 kg',
        packagePrice: 1.69,
        packagesNeeded: 1
      },
      {
        name: 'Wasser oder fettarme Milch',
        amount: 80,
        unit: 'ml',
        portionCost: 0.02,
        packageSize: 'Haushaltsvorrat',
        packagePrice: 0.95,
        packagesNeeded: 0
      }
    ],
    stepInstructions: [
      'Schritt 1: Gib die 50 g zarten Haferflocken zusammen mit 150 g Skyr Natur und ca. 80 ml Wasser oder Milch in ein verschließbares Glas oder eine Schale.',
      'Schritt 2: Rühre die Mischung gründlich um, sodass alle Haferflocken gleichmäßig befeuchtet sind.',
      'Schritt 3: Schneide eine halbe Banane in dünne Scheiben und hebe sie unter die Haferflockenmasse.',
      'Schritt 4: Verschließe das Gefäß und stelle es über Nacht (mindestens 4 Stunden) in den Kühlschrank.',
      'Schritt 5: Morgens die restlichen frischen Bananenscheiben als Topping darauflegen und direkt genießen.'
    ],
    mealPrepTips: 'Perfekt für 3 bis 4 Tage im Voraus vorbereitbar. Spart morgens wertvolle Zeit.',
    storageTips: 'Gekühlt im Kühlschrank bei max. 7°C bis zu 4 Tage haltbar.'
  },
  {
    id: 'rec-quark-pancakes',
    title: 'Protein-Bananen-Pancakes',
    subtitle: 'Luftige Pfannkuchen ohne Zuckerzusatz aus Eiern, Banane und Haferflocken',
    mealType: 'breakfast',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 5,
    cookTimeMinutes: 8,
    difficulty: 'Einfach',
    calories: 380,
    protein: 22.0,
    carbs: 48.0,
    fat: 9.8,
    pricePerPortion: 0.69,
    fullPackageCost: 4.47,
    defaultServings: 1,
    allergens: ['Ei', 'Gluten'],
    ingredients: [
      {
        productId: 'netto-eggs-10stk',
        name: 'Frische Eier Klasse M',
        amount: 2,
        unit: 'Stück',
        portionCost: 0.40,
        packageSize: '10 Stück',
        packagePrice: 1.99,
        packagesNeeded: 1
      },
      {
        productId: 'netto-bananas-1kg',
        name: 'Reife Bio Banane',
        amount: 1,
        unit: 'Stück',
        portionCost: 0.20,
        packageSize: '1 kg',
        packagePrice: 1.69,
        packagesNeeded: 1
      },
      {
        productId: 'netto-oats-500',
        name: 'Zarte Haferflocken',
        amount: 40,
        unit: 'g',
        portionCost: 0.07,
        packageSize: '500 g',
        packagePrice: 0.79,
        packagesNeeded: 1
      },
      {
        productId: 'netto-rapeseed-oil-500',
        name: 'Rapsöl',
        amount: 3,
        unit: 'ml',
        portionCost: 0.02,
        packageSize: '500 ml',
        packagePrice: 1.99,
        packagesNeeded: 1
      }
    ],
    stepInstructions: [
      'Schritt 1: Die Banane schälen und in einer Schüssel mit einer Gabel fein zerdrücken.',
      'Schritt 2: Die 2 Eier und die 40 g Haferflocken hinzufügen und zu einem sämigen Teig verrühren.',
      'Schritt 3: Eine beschichtete Pfanne mit wenigen Tropfen Rapsöl auf mittlerer Stufe erhitzen.',
      'Schritt 4: Jeweils 2 bis 3 kleine Teigportionen in die Pfanne geben und ca. 2 Minuten backen, bis sich kleine Bläschen bilden.',
      'Schritt 5: Vorsichtig wenden und auf der zweiten Seite ca. 1 Minute goldbraun fertigbacken.'
    ],
    mealPrepTips: 'Pancakes lassen sich hervorragend einfrieren und im Toaster wieder aufwärmen.',
    storageTips: 'Gekühlt bis zu 2 Tage haltbar.'
  },

  // =========================================================================
  // 2. MITTAGESSEN (LUNCH)
  // =========================================================================
  {
    id: 'rec-chicken-rice-pan',
    title: 'Cremige Hähnchen-Reis-Pfanne mit Brokkoli',
    subtitle: 'Ausgewogenes Fitness-Gericht – nutzt 150g aus der 400g Netto-Hähnchenpackung',
    mealType: 'lunch',
    dietType: 'omnivore',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 10,
    cookTimeMinutes: 18,
    difficulty: 'Einfach',
    calories: 520,
    protein: 43.5,
    carbs: 58.0,
    fat: 9.2,
    pricePerPortion: 1.92, // Anteilig: Hähnchen 150g (1,31 €) + Reis 65g (0,18 €) + Brokkoli 150g (0,39 €) + Öl/Gewürze (0,04 €)
    fullPackageCost: 8.16, // Volle Packungen: Hähnchen 400g (3,49 €) + Naturreis 500g (1,39 €) + Brokkoli 500g (1,29 €) + Öl 500ml (1,99 €)
    defaultServings: 1,
    allergens: [],
    ingredients: [
      {
        productId: 'netto-chicken-400',
        name: 'Frisches Hähnchenbrustfilet',
        amount: 150,
        unit: 'g',
        portionCost: 1.31,
        packageSize: '400 g Packung',
        packagePrice: 3.49,
        packagesNeeded: 1,
        notes: 'Es verbleiben 250g frisches Hähnchen im Vorrat für Folgetage!'
      },
      {
        productId: 'netto-brown-rice-500',
        name: 'Bio Langkorn Naturreis',
        amount: 65,
        unit: 'g',
        portionCost: 0.18,
        packageSize: '500 g Packung',
        packagePrice: 1.39,
        packagesNeeded: 1,
        notes: 'Trockengewicht'
      },
      {
        productId: 'netto-broccoli-1stk',
        name: 'Frischer Brokkoli',
        amount: 150,
        unit: 'g',
        portionCost: 0.39,
        packageSize: '1 Stück (ca. 500 g)',
        packagePrice: 1.29,
        packagesNeeded: 1,
        notes: 'In kleine Röschen zerteilt'
      },
      {
        productId: 'netto-rapeseed-oil-500',
        name: 'Rapsöl nativ',
        amount: 5,
        unit: 'ml',
        portionCost: 0.02,
        packageSize: '500 ml',
        packagePrice: 1.99,
        packagesNeeded: 1
      },
      {
        name: 'Salz, Pfeffer & Currypulver',
        amount: 1,
        unit: 'TL',
        portionCost: 0.02,
        packageSize: 'Haushaltsvorrat',
        packagePrice: 0.49,
        packagesNeeded: 0
      }
    ],
    stepInstructions: [
      'Schritt 1: Bring 150 ml leicht gesalzenes Wasser in einem kleinen Topf zum Kochen. Den Naturreis hineingeben, Deckel aufsetzen und bei schwacher Hitze ca. 20 Minuten sanft quellen lassen.',
      'Schritt 2: Das Hähnchenbrustfilet mit kaltem Wasser abspülen, mit Küchenpapier trocken tupfen und in ca. 2 cm große mundgerechte Würfel schneiden. Mit Salz, Pfeffer und Currypulver würzen.',
      'Schritt 3: Den Brokkoli waschen und in kleine Röschen schneiden. Den zarten Strunk schälen und in feine Scheiben schneiden.',
      'Schritt 4: 1 TL Rapsöl in einer großen Pfanne auf mittlerer bis hoher Stufe erhitzen. Die Hähnchenwürfel hineingeben und von allen Seiten ca. 4 bis 5 Minuten kräftig anbraten.',
      'Schritt 5: Die Brokkoliröschen dazugeben, 3 EL Wasser hinzufügen, Pfannendeckel aufsetzen und das Gemüse 4 Minuten im Dampf knackig-zart garen.',
      'Schritt 6: Den fertig gegarten Naturreis direkt in die Pfanne unterheben, alles gut vermengen, nochmals kurz abschmecken und servieren.'
    ],
    mealPrepTips: 'Gekochtes Hähnchen mit Reis hält sich gekühlt hervorragend 2 bis 3 Tage und eignet sich ideal als Büro-Lunch.',
    storageTips: 'Gekühlt bei 2-5°C aufbewahren. Vor dem Verzehr in der Pfanne oder Mikrowelle vollständig durcherhitzen.'
  },
  {
    id: 'rec-chicken-paprika-stirfry',
    title: 'Bunte Hähnchen-Paprika-Pfanne (Resteverwertung)',
    subtitle: 'Perfekt für die verbleibenden 250g Hähnchen aus deinem Netto-Einkauf',
    mealType: 'lunch',
    dietType: 'omnivore',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 8,
    cookTimeMinutes: 12,
    difficulty: 'Einfach',
    calories: 460,
    protein: 41.0,
    carbs: 45.0,
    fat: 8.5,
    pricePerPortion: 1.85,
    fullPackageCost: 3.28, // Nutzt Hähnchenreste aus Vorrat! Nur Paprika (1,79 €) und Kartoffeln anteilig
    defaultServings: 1,
    allergens: [],
    ingredients: [
      {
        productId: 'netto-chicken-400',
        name: 'Hähnchenbrustfilet (aus vorhandenem Netto-Vorrat)',
        amount: 150,
        unit: 'g',
        portionCost: 1.31,
        packageSize: 'Bereits vorhanden',
        packagePrice: 0.00,
        packagesNeeded: 0,
        notes: 'Verwertet die angebrochene Packung vom Vortag'
      },
      {
        productId: 'netto-paprika-red-2stk',
        name: 'Paprika-Mix (rot & gelb)',
        amount: 150,
        unit: 'g',
        portionCost: 0.54,
        packageSize: '500 g Packung',
        packagePrice: 1.79,
        packagesNeeded: 1
      },
      {
        productId: 'netto-rapeseed-oil-500',
        name: 'Rapsöl',
        amount: 5,
        unit: 'ml',
        portionCost: 0.02,
        packageSize: '500 ml',
        packagePrice: 1.99,
        packagesNeeded: 0
      }
    ],
    stepInstructions: [
      'Schritt 1: Die restliche Hähnchenbrust in feine Streifen schneiden.',
      'Schritt 2: Die Paprika waschen, entkernen und in Streifen schneiden.',
      'Schritt 3: 1 TL Rapsöl in der Pfanne erhitzen und die Hähnchenstreifen ca. 3 Minuten scharf anbraten.',
      'Schritt 4: Die Paprikastreifen zugeben und unter Wenden 4 Minuten knackig braten.',
      'Schritt 5: Mit Pfeffer, Paprikapulver und etwas Salz abschmecken.'
    ],
    mealPrepTips: 'Frisches Hähnchen nach Anbruch innerhalb von maximal 48 Stunden garen!',
    storageTips: 'Im kältesten Fach des Kühlschranks lagern.'
  },
  {
    id: 'rec-red-lentil-curry',
    title: 'Bio Rote Linsen Daal mit Naturreis',
    subtitle: 'Wärmender pflanzlicher Proteinkick aus haltbaren Netto-Vorräten',
    mealType: 'lunch',
    dietType: 'vegan',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 5,
    cookTimeMinutes: 15,
    difficulty: 'Einfach',
    calories: 485,
    protein: 23.5,
    carbs: 82.0,
    fat: 3.8,
    pricePerPortion: 0.75,
    fullPackageCost: 4.07, // Linsen (1,49 €) + Reis (1,39 €) + Möhren (1,19 €)
    defaultServings: 1,
    allergens: [],
    ingredients: [
      {
        productId: 'netto-red-lentils-500',
        name: 'Bio Rote Linsen',
        amount: 80,
        unit: 'g',
        portionCost: 0.24,
        packageSize: '500 g',
        packagePrice: 1.49,
        packagesNeeded: 1
      },
      {
        productId: 'netto-brown-rice-500',
        name: 'Bio Langkorn Naturreis',
        amount: 60,
        unit: 'g',
        portionCost: 0.17,
        packageSize: '500 g',
        packagePrice: 1.39,
        packagesNeeded: 1
      },
      {
        productId: 'netto-carrots-1kg',
        name: 'Deutsche Bio Möhren',
        amount: 100,
        unit: 'g',
        portionCost: 0.12,
        packageSize: '1 kg',
        packagePrice: 1.19,
        packagesNeeded: 1
      },
      {
        name: 'Currypulver, Kreuzkümmel & Salz',
        amount: 1,
        unit: 'TL',
        portionCost: 0.05,
        packageSize: 'Vorrat',
        packagePrice: 0.50,
        packagesNeeded: 0
      }
    ],
    stepInstructions: [
      'Schritt 1: Reis nach Packungsanweisung in Wasser ca. 20 Minuten gar kochen.',
      'Schritt 2: Möhren schälen und in feine Scheiben schneiden.',
      'Schritt 3: Linsen mit kaltem Wasser abspülen und mit den Möhren und 200 ml Wasser in einen Topf geben.',
      'Schritt 4: Aufkochen lassen, Currypulver und Salz einrühren und bei schwacher Hitze ca. 10 Minuten cremig einköcheln.',
      'Schritt 5: Das cremige Linsen-Curry mit dem warmen Naturreis anrichten.'
    ],
    mealPrepTips: 'Linsen schmecken aufgewärmt am zweiten Tag oft noch aromatischer.',
    storageTips: 'Gekühlt bis zu 4 Tage haltbar.'
  },

  // =========================================================================
  // 3. ABENDESSEN (DINNER)
  // =========================================================================
  {
    id: 'rec-baked-potatoes-quark',
    title: 'Ofenkartoffeln mit cremigem Kräuter-Skyr',
    subtitle: 'Günstiges, sättigendes Feierabendgericht mit viel Kalium und Protein',
    mealType: 'dinner',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 8,
    cookTimeMinutes: 25,
    difficulty: 'Einfach',
    calories: 430,
    protein: 24.0,
    carbs: 68.0,
    fat: 2.5,
    pricePerPortion: 0.88,
    fullPackageCost: 3.68, // Kartoffeln 2,5kg (2,29 €) + Skyr 500g (1,39 €)
    defaultServings: 1,
    allergens: ['Milch / Laktose'],
    ingredients: [
      {
        productId: 'netto-potatoes-2500',
        name: 'Deutsche Speisekartoffeln vorwiegend festkochend',
        amount: 300,
        unit: 'g',
        portionCost: 0.27,
        packageSize: '2,5 kg Beutel',
        packagePrice: 2.29,
        packagesNeeded: 1
      },
      {
        productId: 'netto-skyr-500',
        name: 'Gutes Land Skyr Natur',
        amount: 200,
        unit: 'g',
        portionCost: 0.56,
        packageSize: '500 g Becher',
        packagePrice: 1.39,
        packagesNeeded: 1
      },
      {
        name: 'Salz, Pfeffer & getrocknete Kräuter',
        amount: 1,
        unit: 'TL',
        portionCost: 0.05,
        packageSize: 'Haushaltsvorrat',
        packagePrice: 0.40,
        packagesNeeded: 0
      }
    ],
    stepInstructions: [
      'Schritt 1: Backofen auf 200°C Ober-/Unterhitze (180°C Umluft) vorheizen.',
      'Schritt 2: Die Kartoffeln gründlich waschen, trocken reiben und der Länge nach vierteln.',
      'Schritt 3: Die Kartoffelspalten auf ein mit Backpapier belegtes Blech legen, leicht salzen und ca. 25 Minuten goldbraun und weich backen.',
      'Schritt 4: Den Skyr mit Kräutern, Salz und Pfeffer glatt rühren.',
      'Schritt 5: Die heißen Ofenkartoffeln mit dem kühlen Kräuter-Dip servieren.'
    ],
    mealPrepTips: 'Gebackene Kartoffeln lassen sich tags darauf in der Pfanne knusprig anbraten.',
    storageTips: 'Gekochte Kartoffeln im Kühlschrank bis zu 3 Tage haltbar.'
  },
  {
    id: 'rec-broccoli-omelette',
    title: 'Saftiges Brokkoli-Käse-Omelett',
    subtitle: 'Kohlenhydratarmes Abendessen – schnell zubereitet in unter 15 Minuten',
    mealType: 'dinner',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 5,
    cookTimeMinutes: 8,
    difficulty: 'Einfach',
    calories: 340,
    protein: 26.5,
    carbs: 6.2,
    fat: 21.0,
    pricePerPortion: 1.15,
    fullPackageCost: 4.27,
    defaultServings: 1,
    allergens: ['Ei', 'Milch / Laktose'],
    ingredients: [
      {
        productId: 'netto-eggs-10stk',
        name: 'Frische Eier Klasse M',
        amount: 3,
        unit: 'Stück',
        portionCost: 0.60,
        packageSize: '10 Stück',
        packagePrice: 1.99,
        packagesNeeded: 1
      },
      {
        productId: 'netto-broccoli-1stk',
        name: 'Frischer Brokkoli',
        amount: 150,
        unit: 'g',
        portionCost: 0.39,
        packageSize: '1 Stück (ca. 500 g)',
        packagePrice: 1.29,
        packagesNeeded: 1
      },
      {
        productId: 'netto-cottage-cheese-200',
        name: 'Körniger Frischkäse Halbfettstufe',
        amount: 50,
        unit: 'g',
        portionCost: 0.25,
        packageSize: '200 g',
        packagePrice: 0.99,
        packagesNeeded: 1
      }
    ],
    stepInstructions: [
      'Schritt 1: Brokkoli in sehr kleine Röschen teilen und in einer Pfanne mit 2 EL Wasser 3 Minuten dünsten.',
      'Schritt 2: Die 3 Eier mit Salz und Pfeffer verquirlen.',
      'Schritt 3: Die Eimasse über den Brokkoli gießen und bei milder Hitze stocken lassen.',
      'Schritt 4: Den körnigen Frischkäse auf eine Hälfte des Omeletts geben.',
      'Schritt 5: Das Omelett vorsichtig zusammenklappen und warm genießen.'
    ],
    mealPrepTips: 'Omelett schmeckt auch kalt am nächsten Tag im Büro.',
    storageTips: 'Gekühlt bis zu 24 Stunden haltbar.'
  },

  // =========================================================================
  // 4. SNACKS
  // =========================================================================
  {
    id: 'rec-skyr-berry-snack',
    title: 'Skyr-Proteinsnack pur',
    subtitle: 'Schneller Snack unter 150 kcal für Zwischendurch',
    mealType: 'snack',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 2,
    cookTimeMinutes: 0,
    difficulty: 'Einfach',
    calories: 126,
    protein: 22.0,
    carbs: 8.0,
    fat: 0.4,
    pricePerPortion: 0.56,
    fullPackageCost: 1.39,
    defaultServings: 1,
    allergens: ['Milch / Laktose'],
    ingredients: [
      {
        productId: 'netto-skyr-500',
        name: 'Gutes Land Skyr Natur',
        amount: 200,
        unit: 'g',
        portionCost: 0.56,
        packageSize: '500 g Becher',
        packagePrice: 1.39,
        packagesNeeded: 1
      }
    ],
    stepInstructions: [
      'Schritt 1: 200 g Skyr in eine Schale geben.',
      'Schritt 2: Mit etwas Wasser cremig rühren und direkt löffeln.'
    ],
    mealPrepTips: 'Kann morgens direkt im Becher mitgenommen werden.',
    storageTips: 'Gekühlt aufbewahren.'
  },
  {
    id: 'rec-carrot-cottage-snack',
    title: 'Knackige Möhrensticks mit körnigem Frischkäse',
    subtitle: 'Frischer Gemüsesnack unter 100 kcal',
    mealType: 'snack',
    dietType: 'vegetarian',
    imageUrl: 'images/products/carrots.jpg',
    prepTimeMinutes: 3,
    cookTimeMinutes: 0,
    difficulty: 'Einfach',
    calories: 98,
    protein: 7.5,
    carbs: 8.2,
    fat: 2.2,
    pricePerPortion: 0.45,
    fullPackageCost: 2.18, // Möhren (1,19 €) + Frischkäse (0,99 €)
    defaultServings: 1,
    allergens: ['Milch / Laktose'],
    ingredients: [
      {
        productId: 'netto-carrots-1kg',
        name: 'Deutsche Bio Möhren',
        amount: 120,
        unit: 'g',
        portionCost: 0.14,
        packageSize: '1 kg',
        packagePrice: 1.19,
        packagesNeeded: 1
      },
      {
        productId: 'netto-cottage-cheese-200',
        name: 'Körniger Frischkäse Halbfettstufe',
        amount: 60,
        unit: 'g',
        portionCost: 0.30,
        packageSize: '200 g Becher',
        packagePrice: 0.99,
        packagesNeeded: 1
      }
    ],
    stepInstructions: [
      'Schritt 1: Die Möhren waschen, schälen und in handliche Sticks schneiden.',
      'Schritt 2: Körnigen Frischkäse mit einer Prise Pfeffer verrühren und die Möhren hineindippen.'
    ],
    mealPrepTips: 'Möhrensticks in einer Dose mit einem feuchten Tuch aufbewahrt bleiben den ganzen Tag knackig.',
    storageTips: 'Möhren im Gemüsefach des Kühlschranks lagern.'
  },
  {
    id: 'rec-toast-egg',
    title: 'Goldgelbes Toast mit Spiegelei & Tomate',
    subtitle: 'Klassisches schnelles Frühstück – 2 Scheiben Toast mit frischem Spiegelei',
    mealType: 'breakfast',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 3,
    cookTimeMinutes: 5,
    difficulty: 'Einfach',
    calories: 310,
    protein: 17.5,
    carbs: 26.0,
    fat: 14.5,
    pricePerPortion: 0.65,
    fullPackageCost: 4.97,
    defaultServings: 1,
    allergens: ['Ei', 'Gluten'],
    ingredients: [
      {
        productId: 'netto-toast-500',
        name: 'Butter Toastbrot',
        amount: 2,
        unit: 'Scheiben (50 g)',
        portionCost: 0.15,
        packageSize: '500 g',
        packagePrice: 1.49,
        packagesNeeded: 1
      },
      {
        productId: 'netto-eggs-10stk',
        name: 'Frische Eier Klasse M',
        amount: 2,
        unit: 'Stück',
        portionCost: 0.40,
        packageSize: '10 Stück',
        packagePrice: 1.99,
        packagesNeeded: 1
      },
      {
        productId: 'netto-tomatoes-500',
        name: 'Frische Rispentomaten',
        amount: 50,
        unit: 'g',
        portionCost: 0.10,
        packageSize: '500 g',
        packagePrice: 1.49,
        packagesNeeded: 1
      }
    ],
    stepInstructions: [
      'Schritt 1: Toastbrot im Toaster oder der Pfanne goldbraun rösten.',
      'Schritt 2: 2 Eier in eine Pfanne mit wenig Rapsöl schlagen und 3 Minuten braten, bis das Eiweiß gestockt ist.',
      'Schritt 3: Die Tomate in Scheiben schneiden, auf das Toast legen und das warme Spiegelei darauf platzieren.'
    ],
    mealPrepTips: 'Frisch servieren für optimalen Knusperfaktor.',
    storageTips: 'Spiegeleier immer sofort verzehren.'
  },
  {
    id: 'rec-whole-grain-cottage',
    title: 'Vollkornbrot mit körnigem Hüttenkäse',
    subtitle: 'Ballaststoff- und proteinreiches Abendbrot unter 300 kcal',
    mealType: 'dinner',
    dietType: 'vegetarian',
    imageUrl: 'images/meals/overnight-oats.jpg',
    prepTimeMinutes: 3,
    cookTimeMinutes: 0,
    difficulty: 'Einfach',
    calories: 285,
    protein: 21.0,
    carbs: 32.0,
    fat: 6.5,
    pricePerPortion: 0.85,
    fullPackageCost: 2.48,
    defaultServings: 1,
    allergens: ['Gluten', 'Milch / Laktose'],
    ingredients: [
      {
        productId: 'netto-toast-500',
        name: 'Grafschafter Brot',
        amount: 2,
        unit: 'Scheiben',
        portionCost: 0.15,
        packageSize: '500 g',
        packagePrice: 1.49,
        packagesNeeded: 1
      },
      {
        productId: 'netto-cottage-cheese-200',
        name: 'Körniger Frischkäse Halbfettstufe',
        amount: 140,
        unit: 'g',
        portionCost: 0.70,
        packageSize: '200 g Becher',
        packagePrice: 0.99,
        packagesNeeded: 1
      }
    ],
    stepInstructions: [
      'Schritt 1: Die Brotscheiben bereitstellen.',
      'Schritt 2: Den körnigen Frischkäse großzügig darauf verteilen und mit etwas Schnittlauch oder Pfeffer bestreuen.'
    ],
    mealPrepTips: 'Schnelles Abendessen ohne Kochen.',
    storageTips: 'Angebrochenen Frischkäse im Kühlschrank lagern.'
  },
  {
    id: 'rec-chili-con-carne',
    title: 'Feuriges Chili con Carne mit Kidneybohnen',
    subtitle: 'Sättigende Proteinquelle mit echten Netto Bio-Kidneybohnen und Hähnchenstreifen',
    mealType: 'lunch',
    dietType: 'omnivore',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 8,
    cookTimeMinutes: 18,
    difficulty: 'Einfach',
    calories: 510,
    protein: 42.0,
    carbs: 52.0,
    fat: 11.5,
    pricePerPortion: 2.15,
    fullPackageCost: 7.22,
    defaultServings: 1,
    allergens: [],
    ingredients: [
      {
        productId: 'netto-kidney-beans-400',
        name: 'Bio Rote Kidneybohnen',
        amount: 120,
        unit: 'g (Abtropfgewicht)',
        portionCost: 0.43,
        packageSize: '400 g Dose (240 g Abtropfgewicht)',
        packagePrice: 0.85,
        packagesNeeded: 1
      },
      {
        productId: 'netto-chicken-400',
        name: 'Frisches Hähnchenbrustfilet',
        amount: 150,
        unit: 'g',
        portionCost: 1.31,
        packageSize: '400 g',
        packagePrice: 3.49,
        packagesNeeded: 1
      },
      {
        productId: 'netto-brown-rice-500',
        name: 'Bio Langkorn Naturreis',
        amount: 50,
        unit: 'g',
        portionCost: 0.14,
        packageSize: '500 g',
        packagePrice: 1.39,
        packagesNeeded: 1
      },
      {
        productId: 'netto-tomatoes-500',
        name: 'Rispentomaten',
        amount: 90,
        unit: 'g',
        portionCost: 0.27,
        packageSize: '500 g',
        packagePrice: 1.49,
        packagesNeeded: 1
      }
    ],
    stepInstructions: [
      'Schritt 1: Naturreis in leicht gesalzenem Wasser ca. 20 Minuten garen.',
      'Schritt 2: Das Hähnchenfleisch in mundgerechte Würfel schneiden und in einer Pfanne mit 1 TL Rapsöl anbraten.',
      'Schritt 3: Tomaten würfeln und zusammen mit den abgespülten Kidneybohnen zum Fleisch geben.',
      'Schritt 4: Mit Paprikapulver, Kreuzkümmel, Salz und Chili würzen und 10 Minuten sanft köcheln lassen.',
      'Schritt 5: Das Chili zusammen mit dem warmen Naturreis servieren.'
    ],
    mealPrepTips: 'Lässt sich hervorragend in größerer Menge vorkochen und einfrieren.',
    storageTips: 'Gekühlt bis zu 3 Tage haltbar.'
  },
  {
    id: 'rec-netto-sandwich',
    title: 'Selbstgemachtes Fitness-Club-Sandwich',
    subtitle: 'Doppeldecker-Toast mit gebratenem Hähnchen, Ei und cremigem Frischkäse',
    mealType: 'lunch',
    dietType: 'omnivore',
    imageUrl: 'images/meals/chicken-bowl.jpg',
    prepTimeMinutes: 5,
    cookTimeMinutes: 8,
    difficulty: 'Einfach',
    calories: 435,
    protein: 36.5,
    carbs: 34.0,
    fat: 15.0,
    pricePerPortion: 1.82,
    fullPackageCost: 8.45,
    defaultServings: 1,
    allergens: ['Ei', 'Gluten', 'Milch / Laktose'],
    ingredients: [
      {
        productId: 'netto-toast-500',
        name: 'Butter Toastbrot',
        amount: 2,
        unit: 'Scheiben',
        portionCost: 0.15,
        packageSize: '500 g',
        packagePrice: 1.49,
        packagesNeeded: 1
      },
      {
        productId: 'netto-chicken-400',
        name: 'Hähnchenbrustfilet',
        amount: 100,
        unit: 'g',
        portionCost: 0.87,
        packageSize: '400 g',
        packagePrice: 3.49,
        packagesNeeded: 1
      },
      {
        productId: 'netto-eggs-10stk',
        name: 'Frische Eier Klasse M',
        amount: 1,
        unit: 'Stück',
        portionCost: 0.20,
        packageSize: '10 Stück',
        packagePrice: 1.99,
        packagesNeeded: 1
      },
      {
        productId: 'netto-tomatoes-500',
        name: 'Rispentomaten',
        amount: 50,
        unit: 'g',
        portionCost: 0.15,
        packageSize: '500 g',
        packagePrice: 1.49,
        packagesNeeded: 1
      },
      {
        productId: 'netto-cottage-cheese-200',
        name: 'Körniger Frischkäse',
        amount: 45,
        unit: 'g',
        portionCost: 0.22,
        packageSize: '200 g',
        packagePrice: 0.99,
        packagesNeeded: 1
      }
    ],
    stepInstructions: [
      'Schritt 1: Hähnchenbrust in dünne Tranchen schneiden und in der Pfanne von beiden Seiten je 3 Minuten braten.',
      'Schritt 2: Das Ei parallel als Spiegelei braten.',
      'Schritt 3: 2 Scheiben Toastbrot rösten und dünn mit dem körnigen Frischkäse bestreichen.',
      'Schritt 4: Mit Tomatenscheiben, gebratenem Hähnchen und Spiegelei belegen, zuklappen und diagonal halbieren.'
    ],
    mealPrepTips: 'Perfekt als proteinreicher Snack für unterwegs oder im Büro.',
    storageTips: 'In Pergamentpapier gewickelt bis zu 6 Stunden transportfähig.'
  }
];
