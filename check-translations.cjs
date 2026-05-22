const fs = require('fs');
const path = require('path');

// 1. Point to your app's localization directory
const LOCALES_DIR = path.join(__dirname, 'src/locales');
const sourceFile = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));

// 2. Helper function to flatten deep nested JSON blocks into simple dots paths
function getDeepKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) return res;
    if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getDeepKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
}

const sourceKeys = getDeepKeys(sourceFile).sort();
let hasErrors = false;

// 3. Compare 'en.json' structure with every other language file present
fs.readdirSync(LOCALES_DIR).forEach((file) => {
  if (!file.endsWith('.json') || file === 'en.json') return;

  const targetFile = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8'));
  const targetKeys = getDeepKeys(targetFile).sort();

  const missing = sourceKeys.filter((x) => !targetKeys.includes(x));
  const extra = targetKeys.filter((x) => !sourceKeys.includes(x));

  if (missing.length > 0 || extra.length > 0) {
    console.error(`\n❌ Structure Mismatch Found in File: ${file}`);
    if (missing.length > 0) console.error(`   Missing keys:\n     - ${missing.join('\n     - ')}`);
    if (extra.length > 0) console.error(`   Extra/Unused keys:\n     - ${extra.join('\n     - ')}`);
    hasErrors = true;
  }
});

if (hasErrors) {
  process.exit(1); // Terminates build to flag error status
} else {
  console.log('✅ All translation files match perfectly!');
}
