var fs = require('fs');

const TARGET_LANGS = ['de'];

console.log(`Importing...`);

if(!fs.existsSync(`../../messages_import.csv`)) {
    console.log(`Could not find messages_import.csv, skipping`);
    return;
}

const localeDir = `src/assets/locales`;
const messagesFile = fs.readFileSync(`../../messages_import.csv`, { encoding: 'utf-8', flag: 'r' });
const messages = messagesFile.split('\n');
const lines = messages.slice(1);
const excelLangColumns = {};

let langIndex = 0;
for(const lang of messages[0].split('\t').slice(1)) {
    if(!TARGET_LANGS.includes(lang.toLowerCase().trim())) {
        langIndex++;
        continue;
    }

    excelLangColumns[langIndex] = lang.toLowerCase().trim();
    langIndex++;
}

const currentTranslations = {};

for(const lang of TARGET_LANGS) {
    const path = `../../${localeDir}/${lang}/messages.json`;
    if (!fs.existsSync(path)) {
        throw new Error(`Could not find ${path}. First generate it by running npm run extract.`);
    }

    const file = fs.readFileSync(path, { encoding: 'utf-8', flag: 'r' });
    currentTranslations[lang] = JSON.parse(file);
}

for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length !== (2+TARGET_LANGS.length)) { // 2 = ID, EN
        console.log(parts);
        throw new Error(`Invalid line in messages_import.json: ${line}`);
    }
}

for (const line of lines) {
    const parts = line.trim().split('\t');
    const id = parts[0];
    const translations = parts.slice(1);
    for(let i = 0; i<translations.length; i++) {
        if(!excelLangColumns[(i+1)+'']) {
            continue;
        }

        const lang = excelLangColumns[i+1];
        currentTranslations[lang][id] = translations[i+1];
    }
}

for (const lang of Object.keys(currentTranslations)) {
    fs.writeFileSync(`../../${localeDir}/${lang}/messages.json`, JSON.stringify(currentTranslations[lang], null, 2));
    console.log(`- Done ${lang}`);
}
