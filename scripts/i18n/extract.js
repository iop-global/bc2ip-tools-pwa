var childProcess = require('child_process');
var fs = require('fs');

const SUPPORTED_LANGS = ['en','de'];

console.log(`Extracting...`);
const localeDir = `src/assets/locales`;
childProcess.exec(`ng extract-i18n --format=json --output-path=${localeDir} --out-file=extracted-messages.json`, { cwd: '../../' }, (err, output) => {
    if (err) {
        console.error('could not execute command: ', err);
        return;
    }

    const extracted = JSON.parse(fs.readFileSync(`../../${localeDir}/extracted-messages.json`)).translations;
    const extractedKeys = Object.keys(extracted);
    
    for (const lang of SUPPORTED_LANGS) {
        const path = `../../${localeDir}/${lang}/messages.json`;
        if (fs.existsSync(path)) {
            console.log(`${path} already exists, merging...`);
            const currentTranslation = JSON.parse(fs.readFileSync(path));
            const currentKeys = Object.keys(currentTranslation);
            const deletedKeys = currentKeys.filter(k => !extractedKeys.includes(k));
            const addedKeys = extractedKeys.filter(k => !currentKeys.includes(k));

            deletedKeys.forEach(k => delete currentTranslation[k]);
            addedKeys.forEach(k => currentTranslation[k] = extracted[k]);
        
            fs.writeFileSync(path, JSON.stringify(currentTranslation, null, 2) + '\n');
        }
        else {
            fs.writeFileSync(path, JSON.stringify(extracted, null, 2) + '\n');
        }
    }
    
    fs.rmSync(`../../${localeDir}/extracted-messages.json`);
    console.log(`Done`);
});

