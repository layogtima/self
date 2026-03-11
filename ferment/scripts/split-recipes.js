#!/usr/bin/env node
/**
 * Split tier1-beginner.js into individual JSON files with enhanced schema.
 * Run: node scripts/split-recipes.js
 */

const fs = require('fs');
const path = require('path');

// Load the recipes by simulating the browser environment
global.window = { __fermentRecipes: [] };
require(path.join(__dirname, '..', 'data', 'recipes', 'tier1-beginner.js'));

const recipes = window.__fermentRecipes;
const outDir = path.join(__dirname, '..', 'data', 'recipes', 'individual');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function convertRecipe(recipe) {
  const converted = { ...recipe };

  // Convert images: { hero, heroAttribution } → images array
  if (recipe.images) {
    converted.images = [];
    if (recipe.images.hero) {
      converted.images.push({
        url: recipe.images.hero,
        caption: recipe.name,
        attribution: recipe.images.heroAttribution || '',
        type: 'hero',
        alt: `${recipe.name} - ${recipe.subtitle || ''}`
      });
    }
  } else {
    converted.images = [];
  }

  // Convert video: { url, title, channel } → videos array
  if (recipe.video) {
    converted.videos = [{
      url: recipe.video.url,
      title: recipe.video.title,
      channel: recipe.video.channel,
      type: recipe.video.url && recipe.video.url.includes('youtube') ? 'youtube' : 'local'
    }];
  } else {
    converted.videos = [];
  }
  delete converted.video;

  // Add citations array (empty for now, ready for enrichment)
  converted.citations = [];

  return converted;
}

const manifest = [];

for (const recipe of recipes) {
  const converted = convertRecipe(recipe);
  const filename = `${recipe.slug}.json`;
  const filepath = path.join(outDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(converted, null, 2), 'utf8');
  manifest.push({
    id: recipe.id,
    slug: recipe.slug,
    file: filename
  });

  console.log(`  ✓ ${filename}`);
}

// Write manifest
const manifestPath = path.join(outDir, '..', 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify({ recipes: manifest }, null, 2), 'utf8');

console.log(`\nDone! ${recipes.length} recipes split into ${outDir}`);
console.log(`Manifest written to ${manifestPath}`);
