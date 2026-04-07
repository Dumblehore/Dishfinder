const Fuse = require('fuse.js');

const dishes = [
    { name: "Ice-cream", synonyms: ["desert", "ice"] },
    { name: "Cold Coffee with Ice", synonyms: ["coffee", "cold"] },
    { name: "Veg Fried Rice", synonyms: ["rice", "veg"] },
    { name: "Plain Rice", synonyms: ["rice"] }
];

const testThreshold = (t, ignoreLoc) => {
    console.log(`\n--- Threshold: ${t}, ignoreLocation: ${ignoreLoc} ---`);
    const fuse = new Fuse(dishes, {
        keys: ['name', 'synonyms'],
        includeScore: true,
        threshold: t,
        ignoreLocation: ignoreLoc
    });

    const results = fuse.search('ice');
    results.forEach(r => console.log(`${r.item.name} (Score: ${r.score})`));
};

testThreshold(0.4, false);
testThreshold(0.2, true);
testThreshold(0.1, true);
testThreshold(0.0, true);
