const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, '../../MPG Data - MPG Data.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

const vehicles = [];
const vehicleMap = new Map(); // To deduplicate and aggregate

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const parts = line.split(',');
  if (parts.length < 4) continue;

  const year = parseInt(parts[0]);
  const make = parts[1]; // Make is actually in the 2nd column (labeled "Model")
  const model = parts[2]; // Model is actually in the 3rd column (labeled "Make")
  const mpg = parseFloat(parts[3]);

  // Skip invalid data
  if (!year || year < 2015 || year > 2025) continue; // Focus on recent vehicles
  if (!make || !model) continue;
  if (!mpg || mpg <= 0 || mpg > 60) continue; // Exclude electric/hybrid and invalid data

  // Create unique key
  const key = `${year}|${make.toLowerCase()}|${model.toLowerCase()}`;

  // Aggregate by averaging MPG for same vehicle
  if (vehicleMap.has(key)) {
    const existing = vehicleMap.get(key);
    existing.mpg = (existing.mpg + mpg) / 2;
    existing.count++;
  } else {
    vehicleMap.set(key, { year, make, model, mpg, count: 1 });
  }
}

// Convert to array and estimate city/highway MPG
const vehicleArray = Array.from(vehicleMap.values()).map((v, index) => {
  // Estimate city/highway from combined MPG
  // Typical ratio: highway is ~30% better than city
  // Combined ≈ (city × 0.55 + highway × 0.45)
  const combinedMpg = Math.round(v.mpg);
  const cityMpg = Math.round(combinedMpg * 0.85); // City is typically 85% of combined
  const highwayMpg = Math.round(combinedMpg * 1.25); // Highway is typically 125% of combined

  // Determine fuel type based on make and model
  let fuelType = 'regular';
  const makeLower = v.make.toLowerCase();
  const modelLower = v.model.toLowerCase();

  if (modelLower.includes('diesel') || modelLower.includes('tdi')) {
    fuelType = 'diesel';
  } else if (makeLower.includes('bmw') || makeLower.includes('audi') ||
             makeLower.includes('mercedes') || makeLower.includes('porsche') ||
             makeLower.includes('lexus') || makeLower.includes('acura') ||
             modelLower.includes('premium') || modelLower.includes('turbo')) {
    fuelType = 'premium';
  }

  // Estimate tank size based on vehicle type
  let tankSize = 15; // Default sedan
  if (combinedMpg < 18) {
    tankSize = 22; // Truck/SUV
  } else if (combinedMpg < 25) {
    tankSize = 18; // Larger sedan/small SUV
  } else if (combinedMpg > 35) {
    tankSize = 11; // Small car
  }

  return {
    year: v.year,
    make: capitalize(v.make),
    model: capitalize(v.model),
    vehicleId: index + 1,
    fuelType,
    cityMpg,
    highwayMpg,
    combinedMpg,
    tankSize,
    tankSizeSource: 'estimated'
  };
});

// Sort by make, model, year
vehicleArray.sort((a, b) => {
  if (a.make !== b.make) return a.make.localeCompare(b.make);
  if (a.model !== b.model) return a.model.localeCompare(b.model);
  return b.year - a.year;
});

// Helper function to capitalize
function capitalize(str) {
  return str.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

// Generate TypeScript array
const tsContent = `// Auto-generated from MPG Data CSV
// Total vehicles: ${vehicleArray.length}
// Generation date: ${new Date().toISOString()}

import { VehicleSpec } from '@/types';

export const VEHICLE_DATABASE: VehicleSpec[] = ${JSON.stringify(vehicleArray, null, 2)};
`;

// Write to file
const outputPath = path.join(__dirname, '../app/api/vehicle-specs/database.ts');
fs.writeFileSync(outputPath, tsContent, 'utf-8');

console.log(`✅ Generated vehicle database with ${vehicleArray.length} vehicles`);
console.log(`📁 Output: ${outputPath}`);
console.log(`\nTop 10 makes by count:`);

// Count by make
const makeCount = {};
vehicleArray.forEach(v => {
  makeCount[v.make] = (makeCount[v.make] || 0) + 1;
});

Object.entries(makeCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([make, count]) => {
    console.log(`  ${make}: ${count} vehicles`);
  });
