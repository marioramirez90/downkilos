import { TestBed } from '@angular/core/testing';
import { RecipeCompatibilityService } from './recipe-compatibility.service';
import { Recipe } from '../models/recipe.model';
import { DietaryProfile } from '../models/dietary-profile.model';
import { RECIPES_DATA } from '../models/recipes.data';

describe('RecipeCompatibilityService', () => {
  let service: RecipeCompatibilityService;
  const allRecipes: Recipe[] = RECIPES_DATA;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecipeCompatibilityService]
    });
    service = TestBed.inject(RecipeCompatibilityService);
  });

  it('1. should create the compatibility service', () => {
    expect(service).toBeTruthy();
  });

  it('2. should accept all recipes when profile is null or omnivore with no exclusions', () => {
    const porridge = allRecipes.find(r => r.id === 'rec-porridge-banana')!;
    const chicken = allRecipes.find(r => r.id === 'rec-rice-veggie-pan')!;

    expect(service.isRecipeCompatible(porridge, null)).toBe(true);

    const emptyProfile: DietaryProfile = {
      dietaryForm: 'omnivore',
      intolerances: [],
      allergies: [],
      customExcludedFoods: [],
      dislikes: []
    };
    expect(service.isRecipeCompatible(porridge, emptyProfile)).toBe(true);
    expect(service.isRecipeCompatible(chicken, emptyProfile)).toBe(true);
  });

  it('3. should enforce vegan dietary form strictly (reject milk, eggs, meat)', () => {
    const veganProfile: DietaryProfile = {
      dietaryForm: 'vegan',
      intolerances: [],
      allergies: [],
      customExcludedFoods: [],
      dislikes: []
    };

    const porridgeWithMilk = allRecipes.find(r => r.id === 'rec-porridge-banana')!;
    const scrambledEggs = allRecipes.find(r => r.id === 'rec-scrambled-eggs')!;
    const chickenRice = allRecipes.find(r => r.id === 'rec-rice-veggie-pan')!;
    const redLentils = allRecipes.find(r => r.id === 'rec-red-lentil-curry')!;
    const veganOats = allRecipes.find(r => r.id === 'rec-vegan-apple-oats')!;
    const tofuStirfry = allRecipes.find(r => r.id === 'rec-tofu-veggie-wok')!;

    // Non-vegan dishes must be rejected
    expect(service.isRecipeCompatible(porridgeWithMilk, veganProfile)).toBe(false);
    expect(service.isRecipeCompatible(scrambledEggs, veganProfile)).toBe(false);
    expect(service.isRecipeCompatible(chickenRice, veganProfile)).toBe(false);

    // Vegan dishes must be accepted
    expect(service.isRecipeCompatible(redLentils, veganProfile)).toBe(true);
    expect(service.isRecipeCompatible(veganOats, veganProfile)).toBe(true);
    expect(service.isRecipeCompatible(tofuStirfry, veganProfile)).toBe(true);
  });

  it('4. should enforce vegetarian dietary form (reject meat and fish, allow eggs and dairy)', () => {
    const vegProfile: DietaryProfile = {
      dietaryForm: 'vegetarian',
      intolerances: [],
      allergies: [],
      customExcludedFoods: [],
      dislikes: []
    };

    const chickenRice = allRecipes.find(r => r.id === 'rec-rice-veggie-pan')!;
    const chili = allRecipes.find(r => r.id === 'rec-chili-con-carne')!;
    const scrambledEggs = allRecipes.find(r => r.id === 'rec-scrambled-eggs')!;
    const lentilCurry = allRecipes.find(r => r.id === 'rec-red-lentil-curry')!;

    expect(service.isRecipeCompatible(chickenRice, vegProfile)).toBe(false);
    expect(service.isRecipeCompatible(chili, vegProfile)).toBe(false);
    expect(service.isRecipeCompatible(scrambledEggs, vegProfile)).toBe(true);
    expect(service.isRecipeCompatible(lentilCurry, vegProfile)).toBe(true);
  });

  it('5. should enforce pescatarian dietary form (reject land meat, allow fish)', () => {
    const pescoProfile: DietaryProfile = {
      dietaryForm: 'pescatarian',
      intolerances: [],
      allergies: [],
      customExcludedFoods: [],
      dislikes: []
    };

    const chickenRice = allRecipes.find(r => r.id === 'rec-rice-veggie-pan')!;
    const salmon = allRecipes.find(r => r.id === 'rec-salmon-broccoli-potatoes')!;
    const tunaSalad = allRecipes.find(r => r.id === 'rec-tuna-salad')!;

    expect(service.isRecipeCompatible(chickenRice, pescoProfile)).toBe(false);
    expect(service.isRecipeCompatible(salmon, pescoProfile)).toBe(true);
    expect(service.isRecipeCompatible(tunaSalad, pescoProfile)).toBe(true);
  });

  it('6. should reject recipes with gluten when gluten is excluded', () => {
    const glutenProfile: DietaryProfile = {
      dietaryForm: 'omnivore',
      intolerances: ['gluten_sensitivity'],
      allergies: ['gluten'],
      customExcludedFoods: [],
      dislikes: []
    };

    const breadEgg = allRecipes.find(r => r.id === 'rec-wholegrain-bread-egg')!;
    const porridge = allRecipes.find(r => r.id === 'rec-porridge-banana')!;
    const scrambledEggs = allRecipes.find(r => r.id === 'rec-scrambled-eggs')!;
    const chickpeaCurry = allRecipes.find(r => r.id === 'rec-chickpea-spinach-curry')!;

    expect(service.isRecipeCompatible(breadEgg, glutenProfile)).toBe(false);
    expect(service.isRecipeCompatible(porridge, glutenProfile)).toBe(false);
    expect(service.isRecipeCompatible(scrambledEggs, glutenProfile)).toBe(true);
    expect(service.isRecipeCompatible(chickpeaCurry, glutenProfile)).toBe(true);
  });

  it('7. should reject dairy recipes when lactose / milk allergy is active', () => {
    const lactoseProfile: DietaryProfile = {
      dietaryForm: 'omnivore',
      intolerances: ['lactose'],
      allergies: ['milk'],
      customExcludedFoods: [],
      dislikes: []
    };

    const porridge = allRecipes.find(r => r.id === 'rec-porridge-banana')!;
    const skyrSnack = allRecipes.find(r => r.id === 'rec-skyr-berry-snack')!;
    const redLentils = allRecipes.find(r => r.id === 'rec-red-lentil-curry')!;
    const veganAppleOats = allRecipes.find(r => r.id === 'rec-vegan-apple-oats')!;

    expect(service.isRecipeCompatible(porridge, lactoseProfile)).toBe(false);
    expect(service.isRecipeCompatible(skyrSnack, lactoseProfile)).toBe(false);
    expect(service.isRecipeCompatible(redLentils, lactoseProfile)).toBe(true);
    expect(service.isRecipeCompatible(veganAppleOats, lactoseProfile)).toBe(true);
  });

  it('8. should reject egg recipes when egg allergy is selected', () => {
    const eggProfile: DietaryProfile = {
      dietaryForm: 'omnivore',
      intolerances: [],
      allergies: ['eggs'],
      customExcludedFoods: [],
      dislikes: []
    };

    const scrambled = allRecipes.find(r => r.id === 'rec-scrambled-eggs')!;
    const omelette = allRecipes.find(r => r.id === 'rec-broccoli-omelette')!;
    const redLentils = allRecipes.find(r => r.id === 'rec-red-lentil-curry')!;

    expect(service.isRecipeCompatible(scrambled, eggProfile)).toBe(false);
    expect(service.isRecipeCompatible(omelette, eggProfile)).toBe(false);
    expect(service.isRecipeCompatible(redLentils, eggProfile)).toBe(true);
  });

  it('9. should reject fruit allergens such as banana', () => {
    const bananaProfile: DietaryProfile = {
      dietaryForm: 'omnivore',
      intolerances: [],
      allergies: ['banana'],
      customExcludedFoods: [],
      dislikes: []
    };

    const porridgeBanana = allRecipes.find(r => r.id === 'rec-porridge-banana')!;
    const overnightOats = allRecipes.find(r => r.id === 'rec-overnight-oats')!;
    const redLentils = allRecipes.find(r => r.id === 'rec-red-lentil-curry')!;

    expect(service.isRecipeCompatible(porridgeBanana, bananaProfile)).toBe(false);
    expect(service.isRecipeCompatible(overnightOats, bananaProfile)).toBe(false);
    expect(service.isRecipeCompatible(redLentils, bananaProfile)).toBe(true);
  });

  it('10. should reject custom excluded ingredients (e.g. Brokkoli)', () => {
    const broccoliProfile: DietaryProfile = {
      dietaryForm: 'omnivore',
      intolerances: [],
      allergies: [],
      customExcludedFoods: ['Brokkoli'],
      dislikes: []
    };

    const broccoliOmelette = allRecipes.find(r => r.id === 'rec-broccoli-omelette')!;
    const chickenRice = allRecipes.find(r => r.id === 'rec-rice-veggie-pan')!;
    const scrambled = allRecipes.find(r => r.id === 'rec-scrambled-eggs')!;

    const result = service.checkCompatibility(broccoliOmelette, broccoliProfile);
    expect(result.isCompatible).toBe(false);
    expect(result.conflictReason).toContain('Brokkoli');

    expect(service.isRecipeCompatible(chickenRice, broccoliProfile)).toBe(false);
    expect(service.isRecipeCompatible(scrambled, broccoliProfile)).toBe(true);
  });

  it('11. should filter an array of recipes correctly with filterCompatibleRecipes', () => {
    const vegProfile: DietaryProfile = {
      dietaryForm: 'vegetarian',
      intolerances: ['lactose'],
      allergies: [],
      customExcludedFoods: [],
      dislikes: []
    };

    const filtered = service.filterCompatibleRecipes(allRecipes, vegProfile);
    expect(filtered.length).toBeGreaterThan(0);

    for (const recipe of filtered) {
      // Must not be omnivore meat/fish
      expect(recipe.dietType === 'vegetarian' || recipe.dietType === 'vegan').toBe(true);
      // Must not contain dairy
      expect(recipe.allergens.includes('Milch / Laktose')).toBe(false);
    }
  });
});
