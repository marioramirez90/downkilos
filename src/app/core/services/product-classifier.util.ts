import { ProductCategory, ProductItem } from '../models/product.model';

export interface ProductServingDetail {
  servingLabel: string;
  servingCalories: number | null;
  servingWeightGrams: number;
  isPiece: boolean;
  pieceUnitName?: string;
}

/**
 * Präzise, regelbasierte Lebensmittel-Klassifizierung.
 * Verhindert Verwechslungen (z.B. Nudeln unter Eier, Haferdrink unter Snacks, Schokolade unter Milch).
 */
export function classifyProductCategory(product: Partial<ProductItem>): ProductCategory {
  const name = (product.name || '').toLowerCase().trim();
  const id = (product.id || '').toLowerCase().trim();
  const pkg = (product.packageSize || '').toLowerCase();

  // 1. Fertiggerichte (Pizza, Lasagne, Eintopf, Gnocchi, Ravioli)
  if (
    name.includes('pizza') ||
    name.includes('lasagne') ||
    name.includes('fertiggericht') ||
    name.includes('eintopf') ||
    name.includes('ravioli') ||
    name.includes('gnocchi')
  ) {
    return 'ready_meal';
  }

  // 2. Pflanzliche Drinks (Haferdrink, Sojadrink, Mandeldrink, Reisdrink)
  if (
    name.includes('haferdrink') ||
    name.includes('sojadrink') ||
    name.includes('mandeldrink') ||
    name.includes('reisdrink') ||
    name.includes('pflanzen drink') ||
    name.includes('pflanzendrink') ||
    name.includes('kokos-reisdrink') ||
    (name.includes('barista') && name.includes('drink'))
  ) {
    return 'plant_drinks';
  }

  // 3. Eier (Nur echte Eier; niemals Weizenmehl, Fleischkäse oder Schokoeier)
  if (
    (/\b(eier|hühnereier|bio-eier|frischeier|wieseneier)\b/.test(name) ||
      name.includes('10 frische eier') ||
      name.includes('eier aus') ||
      product.pieceUnitName === 'Ei' ||
      id.includes('egg')) &&
    !name.includes('schoko') &&
    !name.includes('käse') &&
    !name.includes('fleisch') &&
    !name.includes('salat')
  ) {
    return 'eggs';
  }

  // 4. Fisch & Meeresfrüchte
  if (
    name.includes('lachs') ||
    name.includes('thunfisch') ||
    name.includes('forelle') ||
    name.includes('fisch') ||
    name.includes('garnelen') ||
    name.includes('kabeljau') ||
    name.includes('hering') ||
    name.includes('seelachs') ||
    name.includes('scholle') ||
    name.includes('matjes') ||
    name.includes('krabben') ||
    name.includes('fish')
  ) {
    return 'fish';
  }

  // 5. Fleisch & Wurst (Salami, Schinken, Hackfleisch, Hähnchen, Pute etc.)
  if (
    (name.includes('salami') ||
      name.includes('schinken') ||
      name.includes('wurst') ||
      name.includes('fleisch') ||
      name.includes('hähnchen') ||
      name.includes('haehnchen') ||
      name.includes('pute') ||
      name.includes('hack') ||
      name.includes('bacon') ||
      name.includes('speck') ||
      name.includes('leberkäse') ||
      name.includes('cevapcici') ||
      name.includes('steak') ||
      name.includes('filet') ||
      name.includes('gyros') ||
      name.includes('wiener')) &&
    !name.includes('kartoffel') &&
    !name.includes('salat') &&
    !name.includes('suppe') &&
    !name.includes('aufstrich')
  ) {
    return 'meat_sausage';
  }

  // 6. Snacks & Süßigkeiten (Schokolade, Chips, Waffeln, Kekse, Nüsse)
  if (
    name.includes('schokolade') ||
    name.includes('schoko') ||
    name.includes('chips') ||
    name.includes('erdnüss') ||
    name.includes('erdnuss') ||
    name.includes('cashew') ||
    name.includes('walnuss') ||
    name.includes('mandel') ||
    name.includes('keks') ||
    name.includes('waffel') ||
    name.includes('riegel') ||
    name.includes('gummibär') ||
    name.includes('bonbon') ||
    name.includes('cracker') ||
    name.includes('popcorn') ||
    name.includes('salzstange') ||
    name.includes('drops') ||
    name.includes('praline')
  ) {
    return 'snacks_sweets';
  }

  // 7. Brot & Backwaren (Toast, Baguette, Brötchen etc.)
  if (
    name.includes('toast') ||
    name.includes('brot') ||
    name.includes('baguette') ||
    name.includes('brötchen') ||
    name.includes('croissant') ||
    name.includes('fladenbrot') ||
    name.includes('knäckebrot') ||
    name.includes('sandwich') ||
    name.includes('wrap') ||
    name.includes('tortilla')
  ) {
    if (!name.includes('aufstrich') && !name.includes('salat') && !name.includes('suppe')) {
      return 'bakery';
    }
  }

  // 8. Frühstück & Müsli (Haferflocken, Müsli, Cornflakes)
  if (
    name.includes('haferflocken') ||
    (name.includes('hafer') && name.includes('flocken')) ||
    name.includes('müsli') ||
    name.includes('crunchy') ||
    name.includes('cornflakes') ||
    name.includes('flakes') ||
    name.includes('porridge') ||
    name.includes('cerealien')
  ) {
    return 'breakfast_cereals';
  }

  // 9. Nudeln & Reis (Pasta, Spaghetti, Penne, Basmati, Naturreis etc.)
  if (
    name.includes('nudel') ||
    name.includes('pasta') ||
    name.includes('spaghetti') ||
    name.includes('penne') ||
    name.includes('fusilli') ||
    name.includes('rigatoni') ||
    name.includes('tortellini') ||
    name.includes('tagliatelle') ||
    name.includes('makkaroni') ||
    (name.includes('reis') && !name.includes('sirup')) ||
    name.includes('naturreis') ||
    name.includes('basmati') ||
    name.includes('parboiled')
  ) {
    if (!name.includes('sauce') && !name.includes('suppe') && !name.includes('salat') && !name.includes('waffel')) {
      return 'pasta_rice';
    }
  }

  // 10. Öle & Fette
  if (
    /\b(öl|rapsöl|olivenöl|sonnenblumenöl|leinöl|kokosöl|pflanzenöl|butter|margarine)\b/.test(name) &&
    !name.includes('sardinen') &&
    !name.includes('pesto')
  ) {
    return 'oils_fats';
  }

  // 11. Milchprodukte (Milch, Quark, Skyr, Joghurt, Frischkäse, Käse)
  if (
    /\b(milch|joghurt|quark|speisequark|frischkäse|skyr|käse|gouda|edamer|emmentaler|mozzarella|parmesan|grana padano|sahne|schmand|creme fraiche|pudding)\b/.test(
      name
    ) &&
    !name.includes('schoko')
  ) {
    return 'dairy';
  }

  // 12. Getränke
  if (
    /\b(wasser|mineralwasser|saft|direktsaft|orangensaft|apfelsaft|cola|limonade|eistee|tee|kaffee|espresso|getränk|smoothie|drink)\b/.test(
      name
    )
  ) {
    return 'beverages';
  }

  // 13. Konserven
  if (
    /\b(kidney|bohnen|kichererbsen|erbsen|linsen|mais|gewürzgurken|kapern|oliven|apfelmus|passata|passiert|tomatenmark)\b/.test(
      name
    ) ||
    pkg.includes('dose') ||
    pkg.includes('glas')
  ) {
    return 'canned';
  }

  // 14. Soßen & Dressings
  if (/\b(sauce|nudelsauce|pesto|ketchup|senf|mayonnaise|dressing|essig|balsamico)\b/.test(name)) {
    return 'sauces';
  }

  // 15. Obst & Gemüse
  if (
    /\b(apfel|äpfel|banane|bananen|birne|beeren|erdbeeren|himbeeren|blaubeeren|trauben|orange|zitronen|tomate|tomaten|gurke|gurken|salat|romanasalat|möhre|möhren|karotte|karotten|brokkoli|blumenkohl|paprika|kartoffel|kartoffeln|speisekartoffeln|zwiebeln|knoblauch|champignons|pilze|spinat|zucchini)\b/.test(
      name
    )
  ) {
    return 'fruits_veg';
  }

  // Fallback zu bestehender Kategorie
  if (product.category === 'fruits_veg') return 'fruits_veg';
  if (product.category === 'dairy') return 'dairy';
  if (product.category === 'meat_fish') return 'meat_sausage';
  if (product.category === 'beverages') return 'beverages';
  if (product.category === 'ready_meal') return 'ready_meal';
  if (product.category === 'grains') return 'bakery';
  if (product.category === 'pantry') return 'canned';

  return 'other';
}

/**
 * Berechnet produktspezifische Portionsangaben mathematisch fundiert:
 * - Toast / Brot -> 1 Scheibe (z.B. 33g)
 * - Scheibensalami -> 1 Scheibe (z.B. 15g)
 * - Eier -> 1 Ei (z.B. 53g essbar)
 * - Banane -> 1 Banane (ca. 102g essbar)
 * - Milch / Haferdrink / Säfte -> 1 Glas (250 ml)
 * - Skyr / Joghurt -> 1 Becher bzw. 1 Portion
 * - Nudeln / Reis -> 100 g (trocken)
 */
export function getProductServingDetail(product: Partial<ProductItem>): ProductServingDetail {
  const name = (product.name || '').toLowerCase();
  const cals100 = product.nutrition?.caloriesPer100g ?? null;
  const packageGrams = product.packageWeightGrams || 500;
  const pieces = product.piecesPerPackage;

  // 1. Toastbrot & Scheibenbrot
  if (product.pieceUnitName === 'Scheibe' || name.includes('toast') || (name.includes('brot') && !name.includes('aufstrich'))) {
    const pieceCount = pieces && pieces > 0 ? pieces : (name.includes('toast') ? 15 : 10);
    const sliceGrams = Math.round((packageGrams / pieceCount) * 10) / 10;
    const cals = cals100 !== null ? Math.round((sliceGrams * cals100) / 100) : null;
    return {
      servingLabel: '1 Scheibe',
      servingCalories: cals,
      servingWeightGrams: sliceGrams,
      isPiece: true,
      pieceUnitName: 'Scheibe'
    };
  }

  // 2. Salami / Schinken in Scheiben
  if (name.includes('salami') || name.includes('schinken') || name.includes('aufschnitt')) {
    if (name.includes('scheiben') || (pieces && pieces > 1) || packageGrams <= 200) {
      const pieceCount = pieces && pieces > 0 ? pieces : 8;
      const sliceGrams = Math.round((packageGrams / pieceCount) * 10) / 10;
      const cals = cals100 !== null ? Math.round((sliceGrams * cals100) / 100) : null;
      return {
        servingLabel: '1 Scheibe',
        servingCalories: cals,
        servingWeightGrams: sliceGrams,
        isPiece: true,
        pieceUnitName: 'Scheibe'
      };
    }
  }

  // 3. Eier
  if (product.pieceUnitName === 'Ei' || name.includes('eier') || name.includes('ei ')) {
    const eggEdibleGrams = 53;
    const cals = cals100 !== null ? Math.round((eggEdibleGrams * cals100) / 100) : null;
    return {
      servingLabel: '1 Ei',
      servingCalories: cals,
      servingWeightGrams: eggEdibleGrams,
      isPiece: true,
      pieceUnitName: 'Ei'
    };
  }

  // 4. Bananen
  if (name.includes('banan')) {
    const bananaEdibleGrams = 102; // 150g Rohgewicht * 0.68 essbarer Anteil
    const cals = cals100 !== null ? Math.round((bananaEdibleGrams * cals100) / 100) : null;
    return {
      servingLabel: '1 Banane',
      servingCalories: cals,
      servingWeightGrams: bananaEdibleGrams,
      isPiece: true,
      pieceUnitName: 'Banane'
    };
  }

  // 5. Getränke & Pflanzliche Drinks (Milch, Haferdrink, Saft, Wasser)
  const isDrink =
    name.includes('milch') ||
    name.includes('drink') ||
    name.includes('saft') ||
    name.includes('wasser') ||
    name.includes('cola') ||
    name.includes('tee') ||
    name.includes('kaffee');
  if (isDrink && !name.includes('schokolade') && !name.includes('pulver')) {
    const glassVolume = 250;
    const cals = cals100 !== null ? Math.round((glassVolume * cals100) / 100) : null;
    return {
      servingLabel: '1 Glas (250 ml)',
      servingCalories: cals,
      servingWeightGrams: glassVolume,
      isPiece: false
    };
  }

  // 6. Skyr & Joghurt & Quark
  if (name.includes('skyr') || name.includes('joghurt') || name.includes('quark')) {
    if (packageGrams <= 250) {
      const cals = cals100 !== null ? Math.round((packageGrams * cals100) / 100) : null;
      return {
        servingLabel: `1 Becher (${packageGrams} g)`,
        servingCalories: cals,
        servingWeightGrams: packageGrams,
        isPiece: false
      };
    }
    const portionGrams = 150;
    const cals = cals100 !== null ? Math.round((portionGrams * cals100) / 100) : null;
    return {
      servingLabel: '1 Portion (150 g)',
      servingCalories: cals,
      servingWeightGrams: portionGrams,
      isPiece: false
    };
  }

  // 7. Nudeln & Reis
  if (name.includes('nudel') || name.includes('pasta') || name.includes('spaghetti') || name.includes('penne') || name.includes('reis')) {
    const rawPortion = 100;
    const cals = cals100 !== null ? Math.round(cals100) : null;
    return {
      servingLabel: '100 g (trocken)',
      servingCalories: cals,
      servingWeightGrams: rawPortion,
      isPiece: false
    };
  }

  // 8. Konserven (Bohnen, Mais, Linsen)
  if (product.drainedWeightGrams && product.drainedWeightGrams > 0) {
    const portionGrams = 100;
    const cals = cals100 !== null ? Math.round((portionGrams * cals100) / 100) : null;
    return {
      servingLabel: '100 g (Abtropfgewicht)',
      servingCalories: cals,
      servingWeightGrams: portionGrams,
      isPiece: false
    };
  }

  // 9. Standard-Portion
  const defaultServing = product.servingSizeGrams || 100;
  const cals = cals100 !== null ? Math.round((defaultServing * cals100) / 100) : null;
  return {
    servingLabel: product.servingUnit || `1 Portion (${defaultServing} g)`,
    servingCalories: cals,
    servingWeightGrams: defaultServing,
    isPiece: false
  };
}
