var fs = require('fs');

const SOURCE_LANG = 'en';
const TARGET_LANGS = ['de'];

console.log(`Exporting translations...`);

const localeDir = `src/assets/locales`;
const sourceLangPath = `../../${localeDir}/${SOURCE_LANG}/messages.json`;

if (!fs.existsSync(sourceLangPath)) {
    throw new Error(`Could not find source language file: ${sourceLangPath}. First generate it by running npm run extract.`);
}

const sourceTranslationMap = JSON.parse(fs.readFileSync(sourceLangPath));
const translationMap = {};

for(const lang of TARGET_LANGS) {
    const path = `../../${localeDir}/${lang}/messages.json`;
    if (!fs.existsSync(path)) {
        throw new Error(`Could not find ${localeDir}/${lang}/messages.json. First generate it by running npm run extract.`);
    }

    translationMap[lang] = JSON.parse(fs.readFileSync(path));
}

const csvLines = [];
for(const id of Object.keys(sourceTranslationMap)) {
    const columns = [id, sourceTranslationMap[id]];

    for(const lang of TARGET_LANGS) {
        const translatedText = translationMap[lang][id] ?? sourceTranslationMap[id];
        columns.push(translatedText);
    }
    
    csvLines.push(columns.join('#'));
}

fs.writeFileSync(`../../messages_export.csv`, csvLines.join('\n'));
    