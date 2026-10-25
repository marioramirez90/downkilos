import { Injectable } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { DietaryForm, DietaryProfile } from '../models/dietary-profile.model';

export interface RecipeCompatibilityResult {
  isCompatible: boolean;
  conflictReason?: string;
  matchedConflicts: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RecipeCompatibilityService {
  /**
   * Prüft ein Rezept umfassend gegen ein Ernährungsprofil:
   * 1. Ernährungsform (Vegan, Vegetarisch, Pesketarisch, Omnivor)
   * 2. 14 EU-Allergene & Unverträglichkeiten (Laktose, Gluten, Fruktose etc.)
   * 3. Fruchtallergien (Banane, Apfel, Erdbeere, Kiwi etc.)
   * 4. Individuelle Zutatenausschlüsse & Abneigungen (Pilze, Zwiebeln, Schweinefleisch etc.)
   */
  checkCompatibility(recipe: Recipe, profile: DietaryProfile | null): RecipeCompatibilityResult {
    if (!profile) {
      return { isCompatible: true, matchedConflicts: [] };
    }

    const conflicts: string[] = [];

    // 1. Ernährungsform prüfen
    const dietConflict = this.checkDietaryForm(recipe, profile.dietaryForm);
    if (dietConflict) {
      conflicts.push(dietConflict);
    }

    // 2. Allergene prüfen (EU-14 + Früchte)
    const allergenConflicts = this.checkAllergens(recipe, profile.allergies || []);
    conflicts.push(...allergenConflicts);

    // 3. Unverträglichkeiten prüfen
    const intoleranceConflicts = this.checkIntolerances(recipe, profile.intolerances || []);
    conflicts.push(...intoleranceConflicts);

    // 4. Individuelle Lebensmittel-Ausschlüsse (customExcludedFoods)
    const customExclusionConflicts = this.checkCustomExclusions(
      recipe,
      profile.customExcludedFoods || [],
      'Ausgeschlossene Zutat'
    );
    conflicts.push(...customExclusionConflicts);

    // 5. Persönliche Abneigungen (dislikes)
    const dislikeConflicts = this.checkCustomExclusions(
      recipe,
      profile.dislikes || [],
      'Ungeliebte Zutat'
    );
    conflicts.push(...dislikeConflicts);

    // Deduplizieren
    const uniqueConflicts = Array.from(new Set(conflicts));

    return {
      isCompatible: uniqueConflicts.length === 0,
      conflictReason: uniqueConflicts.length > 0 ? uniqueConflicts[0] : undefined,
      matchedConflicts: uniqueConflicts
    };
  }

  isRecipeCompatible(recipe: Recipe, profile: DietaryProfile | null): boolean {
    return this.checkCompatibility(recipe, profile).isCompatible;
  }

  filterCompatibleRecipes(recipes: Recipe[], profile: DietaryProfile | null): Recipe[] {
    if (!profile) return recipes;
    return recipes.filter(r => this.isRecipeCompatible(r, profile));
  }

  // =========================================================================
  // PRIVATE PRÜFMETHODEN
  // =========================================================================

  private checkDietaryForm(recipe: Recipe, userForm?: DietaryForm): string | null {
    if (!userForm || userForm === 'omnivore' || userForm === 'none') {
      return null;
    }

    const recipeDiet = recipe.dietType;
    const forms = recipe.dietaryForms || [];

    if (userForm === 'vegan') {
      const isVegan = recipeDiet === 'vegan' || forms.includes('vegan');
      if (!isVegan) {
        return 'Ernährungsform: Rezept ist nicht vegan (enthält tierische Bestandteile)';
      }
      // Zusätzlicher Schutz: Tierische Schlagwörter in Zutaten
      const hasAnimalProducts = recipe.ingredients.some(ing => {
        const n = ing.name.toLowerCase();
        return (
          n.includes('hähnchen') ||
          n.includes('fleisch') ||
          n.includes('rind') ||
          n.includes('schwein') ||
          n.includes('fisch') ||
          n.includes('lachs') ||
          n.includes('thunfisch') ||
          n.includes('skyr') ||
          n.includes('quark') ||
          n.includes('milch') && !n.includes('hafermilch') && !n.includes('sojamilch') && !n.includes('mandelmilch') ||
          n.includes('käse') && !n.includes('vegan') ||
          n.includes('eier') ||
          n.includes('rührei') ||
          n.includes('spiegelei') ||
          (n.includes('ei') && !n.includes('reis') && !n.includes('speise') && !n.includes('fleisch'))
        );
      });
      if (hasAnimalProducts) {
        return 'Ernährungsform: Rezept enthält nicht-vegane Zutaten';
      }
    } else if (userForm === 'vegetarian') {
      const isVeg = recipeDiet === 'vegetarian' || recipeDiet === 'vegan' || forms.includes('vegetarian') || forms.includes('vegan');
      if (!isVeg) {
        return 'Ernährungsform: Rezept ist nicht vegetarisch (enthält Fleisch oder Fisch)';
      }
      const hasMeat = recipe.ingredients.some(ing => {
        const n = ing.name.toLowerCase();
        return (
          n.includes('hähnchen') ||
          n.includes('fleisch') ||
          n.includes('rind') ||
          n.includes('schwein') ||
          n.includes('speck') ||
          n.includes('schinken') ||
          n.includes('fisch') ||
          n.includes('lachs') ||
          n.includes('thunfisch')
        );
      });
      if (hasMeat) {
        return 'Ernährungsform: Rezept enthält Fleisch oder Fisch';
      }
    } else if (userForm === 'pescatarian') {
      const hasLandMeat = recipe.ingredients.some(ing => {
        const n = ing.name.toLowerCase();
        return (
          n.includes('hähnchen') ||
          n.includes('fleisch') ||
          n.includes('rind') ||
          n.includes('schwein') ||
          n.includes('speck') ||
          n.includes('schinken') ||
          n.includes('hackfleisch') ||
          n.includes('pute')
        );
      });
      if (hasLandMeat) {
        return 'Ernährungsform: Rezept enthält Fleisch';
      }
    }

    return null;
  }

  private checkAllergens(recipe: Recipe, allergies: string[]): string[] {
    const conflicts: string[] = [];
    const recipeAllergensLower = (recipe.allergens || []).map(a => a.toLowerCase());
    const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
    const allText = `${recipe.title.toLowerCase()} ${recipe.subtitle?.toLowerCase() || ''} ${ingredientNames.join(' ')}`;

    for (const allergy of allergies) {
      const id = allergy.toLowerCase();

      // EU-14 Allergene & Früchte abgleichen
      if (id === 'gluten' || id === 'weizen') {
        const hasGluten =
          recipeAllergensLower.some(a => a.includes('gluten') || a.includes('weizen')) ||
          allText.includes('haferflocken') ||
          allText.includes('toast') ||
          allText.includes('vollkornbrot') ||
          allText.includes('brot') ||
          allText.includes('nudeln') ||
          allText.includes('weizen');
        if (hasGluten) {
          conflicts.push('Allergen: Glutenhaltiges Getreide');
        }
      } else if (id === 'milk' || id === 'lactose' || id === 'milch' || id === 'laktose') {
        const hasMilk =
          recipeAllergensLower.some(a => a.includes('milch') || a.includes('laktose')) ||
          allText.includes('milch') ||
          allText.includes('skyr') ||
          allText.includes('quark') ||
          allText.includes('frischkäse') ||
          allText.includes('hüttenkäse') ||
          allText.includes('käse');
        if (hasMilk) {
          conflicts.push('Allergen: Milch / Laktose');
        }
      } else if (id === 'eggs' || id === 'egg' || id === 'ei' || id === 'eier') {
        const hasEgg =
          recipeAllergensLower.some(a => a.includes('ei')) ||
          allText.includes('eier') ||
          allText.includes('spiegelei') ||
          allText.includes('rührei') ||
          allText.includes('omelett') ||
          recipe.ingredients.some(ing => {
            const n = ing.name.toLowerCase();
            return n.startsWith('ei ') || n === 'ei' || n.includes('frische eier');
          });
        if (hasEgg) {
          conflicts.push('Allergen: Eier');
        }
      } else if (id === 'peanuts' || id === 'erdnüsse') {
        if (allText.includes('erdnuss') || allText.includes('erdnüsse') || recipeAllergensLower.some(a => a.includes('erdnuss'))) {
          conflicts.push('Allergen: Erdnüsse');
        }
      } else if (id === 'nuts' || id === 'schalenfrüchte') {
        if (
          allText.includes('nuss') ||
          allText.includes('nüsse') ||
          allText.includes('mandel') ||
          allText.includes('walnuss') ||
          allText.includes('haselnuss') ||
          allText.includes('cashew') ||
          recipeAllergensLower.some(a => a.includes('nuss') || a.includes('schalenfrüchte'))
        ) {
          conflicts.push('Allergen: Schalenfrüchte');
        }
      } else if (id === 'fish' || id === 'fisch') {
        if (allText.includes('fisch') || allText.includes('lachs') || allText.includes('thunfisch') || recipeAllergensLower.some(a => a.includes('fisch'))) {
          conflicts.push('Allergen: Fisch');
        }
      } else if (id === 'crustaceans' || id === 'krebstiere') {
        if (allText.includes('krebstiere') || allText.includes('garnele') || allText.includes('shrimp')) {
          conflicts.push('Allergen: Krebstiere');
        }
      } else if (id === 'soy' || id === 'soja') {
        if (allText.includes('soja') || allText.includes('tofu') || recipeAllergensLower.some(a => a.includes('soja'))) {
          conflicts.push('Allergen: Soja');
        }
      } else if (id === 'celery' || id === 'sellerie') {
        if (allText.includes('sellerie')) {
          conflicts.push('Allergen: Sellerie');
        }
      } else if (id === 'mustard' || id === 'senf') {
        if (allText.includes('senf')) {
          conflicts.push('Allergen: Senf');
        }
      } else if (id === 'sesame' || id === 'sesam') {
        if (allText.includes('sesam') || recipeAllergensLower.some(a => a.includes('sesam'))) {
          conflicts.push('Allergen: Sesam');
        }
      } else if (id === 'sulphites' || id === 'sulfite') {
        if (allText.includes('sulfit') || allText.includes('schwefeldioxid')) {
          conflicts.push('Allergen: Schwefeldioxid & Sulfite');
        }
      } else if (id === 'lupin' || id === 'lupinen') {
        if (allText.includes('lupin')) {
          conflicts.push('Allergen: Lupinen');
        }
      } else if (id === 'molluscs' || id === 'weichtiere') {
        if (allText.includes('weichtier') || allText.includes('muschel')) {
          conflicts.push('Allergen: Weichtiere');
        }
      } else if (id === 'banana' || id === 'banane' || id === 'bananen') {
        if (allText.includes('banane') || allText.includes('bananen')) {
          conflicts.push('Frucht-Allergen: Banane');
        }
      } else if (id === 'apple' || id === 'apfel' || id === 'äpfel') {
        if (allText.includes('apfel') || allText.includes('äpfel')) {
          conflicts.push('Frucht-Allergen: Apfel');
        }
      } else if (id === 'strawberry' || id === 'erdbeere' || id === 'erdbeeren') {
        if (allText.includes('erdbeere') || allText.includes('erdbeeren')) {
          conflicts.push('Frucht-Allergen: Erdbeere');
        }
      } else if (id === 'kiwi') {
        if (allText.includes('kiwi')) {
          conflicts.push('Frucht-Allergen: Kiwi');
        }
      } else if (id === 'citrus' || id === 'zitrusfrüchte') {
        if (allText.includes('zitrone') || allText.includes('orange') || allText.includes('limette')) {
          conflicts.push('Frucht-Allergen: Zitrusfrüchte');
        }
      } else if (id === 'peach' || id === 'pfirsich') {
        if (allText.includes('pfirsich') || allText.includes('nektarine')) {
          conflicts.push('Frucht-Allergen: Pfirsich');
        }
      } else if (id === 'cherry' || id === 'kirsche' || id === 'kirschen') {
        if (allText.includes('kirsche') || allText.includes('kirschen')) {
          conflicts.push('Frucht-Allergen: Kirsche');
        }
      } else {
        // Generischer Textabgleich
        if (allText.includes(id)) {
          conflicts.push(`Allergen: ${allergy}`);
        }
      }
    }

    return conflicts;
  }

  private checkIntolerances(recipe: Recipe, intolerances: string[]): string[] {
    const conflicts: string[] = [];
    const recipeAllergensLower = (recipe.allergens || []).map(a => a.toLowerCase());
    const allText = `${recipe.title.toLowerCase()} ${recipe.subtitle?.toLowerCase() || ''} ${recipe.ingredients.map(i => i.name.toLowerCase()).join(' ')}`;

    for (const into of intolerances) {
      const id = into.toLowerCase();
      if (id === 'none') continue;

      if (id === 'lactose' || id === 'laktose' || id === 'laktosefrei') {
        const hasMilk =
          recipeAllergensLower.some(a => a.includes('milch') || a.includes('laktose')) ||
          allText.includes('milch') ||
          allText.includes('skyr') ||
          allText.includes('quark') ||
          allText.includes('frischkäse') ||
          allText.includes('hüttenkäse') ||
          allText.includes('käse');
        if (hasMilk) {
          conflicts.push('Unverträglichkeit: Laktose');
        }
      } else if (id === 'gluten_sensitivity' || id === 'celiac' || id === 'glutenfrei') {
        const hasGluten =
          recipeAllergensLower.some(a => a.includes('gluten') || a.includes('weizen')) ||
          allText.includes('haferflocken') ||
          allText.includes('toast') ||
          allText.includes('vollkornbrot') ||
          allText.includes('brot') ||
          allText.includes('nudeln');
        if (hasGluten) {
          conflicts.push('Unverträglichkeit: Gluten');
        }
      } else if (id === 'fructose') {
        if (allText.includes('honig') || allText.includes('apfel') || allText.includes('trockenobst') || allText.includes('birne')) {
          conflicts.push('Unverträglichkeit: Fruktose (hoher Fruchtzuckergehalt)');
        }
      } else if (id === 'histamine') {
        if (allText.includes('thunfisch') || allText.includes('reifer käse') || allText.includes('sauerkraut') || allText.includes('tomatenmark')) {
          conflicts.push('Unverträglichkeit: Histamin');
        }
      } else if (id === 'sorbitol') {
        if (allText.includes('pflaume') || allText.includes('birne') || allText.includes('kirsche') || allText.includes('pfirsich')) {
          conflicts.push('Unverträglichkeit: Sorbit');
        }
      }
    }

    return conflicts;
  }

  private checkCustomExclusions(recipe: Recipe, terms: string[], prefix: string): string[] {
    const conflicts: string[] = [];
    const allText = `${recipe.title.toLowerCase()} ${recipe.subtitle?.toLowerCase() || ''} ${recipe.ingredients.map(i => i.name.toLowerCase()).join(' ')}`;

    for (const term of terms) {
      const trimmed = term.trim().toLowerCase();
      if (!trimmed) continue;

      let matched = false;

      // Spezifische Synonyme
      if (trimmed === 'schweinefleisch' || trimmed === 'schwein') {
        matched = allText.includes('schwein') || allText.includes('speck') || allText.includes('schinken');
      } else if (trimmed === 'pilze' || trimmed === 'champignons') {
        matched = allText.includes('pilz') || allText.includes('champignon');
      } else if (trimmed === 'zwiebeln' || trimmed === 'zwiebel') {
        matched = allText.includes('zwiebel');
      } else if (trimmed === 'brokkoli') {
        matched = allText.includes('brokkoli');
      } else if (trimmed === 'knoblauch') {
        matched = allText.includes('knoblauch');
      } else if (trimmed === 'koriander') {
        matched = allText.includes('koriander');
      } else if (trimmed === 'oliven') {
        matched = allText.includes('olive') || allText.includes('oliven');
      } else if (trimmed === 'paprika') {
        matched = allText.includes('paprika');
      } else if (trimmed === 'rosenkohl') {
        matched = allText.includes('rosenkohl');
      } else if (trimmed === 'kuhmilch' || trimmed === 'milch') {
        matched = allText.includes('milch') && !allText.includes('hafermilch') && !allText.includes('mandelmilch');
      } else {
        matched = allText.includes(trimmed);
      }

      if (matched) {
        conflicts.push(`${prefix}: ${term}`);
      }
    }

    return conflicts;
  }
}
