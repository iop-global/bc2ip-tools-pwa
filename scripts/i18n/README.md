# Export/Import for i18n Files

## Install

```bash
$ npm ci
```

## Usage

### 1. Import

Import new changes from Google Sheet

1. Download the app's TSV from the Google Sheet. NOTE: use tsv file!
2. Copy the TSV file to this repo's root as `messages_import.csv`.
3. Run the command below:
  ```bash
  $ npm run import
  ```

### 2. Extract

Extracts the labels from all the apps' source files.

```bash
$ npm run extract
```

It will generate files: `src/assets/locales/[de|en]messages.json`.

Note: if a language file already exists, it will merge them.

### 3. Export

Exports the currently available translation pack to csv which can be imported to google sheet. It should be done once or when lots of new lines were added.

```bash
$ npm run export
```

You will find one new file in the end in the root:

- `messages_export.csv`

**Import settings for Google Sheet**

- Import location: Replace current sheet
- Separator type: Custom -> #
- Convert text to numbers...: disable

