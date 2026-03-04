const fs = require('fs');
const content = fs.readFileSync('src/app/globals.css', 'utf-8');

// Extract light and dark blocks
const rootMatch = content.match(/:root\s*{([^}]*)}/);
const darkMatch = content.match(/\.dark\s*{([^}]*)}/);

if (!rootMatch || !darkMatch) {
  console.log("Could not find root or dark blocks");
  process.exit(1);
}

const rootVars = rootMatch[1];
const darkVars = darkMatch[1];

const themes = {
  zinc: { oldHue: '250', replaceStr: (str) => str.replace(/oklch\(([\d.%]+) ([\d.%]+) 250\)/g, 'oklch($1 0.005 0)') },
  green: { oldHue: '250', newHue: '150' },
  rose: { oldHue: '250', newHue: '350' },
  orange: { oldHue: '250', newHue: '45' },
};

let additionalCss = '\n/* Dynamic Themes */\n';

for (const [name, config] of Object.entries(themes)) {
  let newRoot = rootVars;
  let newDark = darkVars;
  
  if (config.replaceStr) {
    newRoot = config.replaceStr(newRoot);
    newDark = config.replaceStr(newDark);
  } else {
    newRoot = newRoot.replace(/250(?=[^\d]|$|\))/g, config.newHue).replace(/254\.128/g, Number(config.newHue)+4 + "").replace(/265\.522/g, Number(config.newHue)+15 + "");
    newDark = newDark.replace(/250(?=[^\d]|$|\))/g, config.newHue).replace(/254\.128/g, Number(config.newHue)+4 + "").replace(/265\.522/g, Number(config.newHue)+15 + "");
  }

  // Also replace sidebar, etc which might have hardcoded colors
  // But wait! Red tone (destructive) is hue 27 or 22. Green tone (success) is 145.
  // We only replace hue 250.
  
  additionalCss += `\nhtml.theme-${name} {\n${newRoot}}\n`;
  additionalCss += `\nhtml.theme-${name}.dark {\n${newDark}}\n`;
}

fs.appendFileSync('src/app/globals.css', additionalCss);
console.log("Themes added to globals.css");
