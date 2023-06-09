const fs = require('fs');
const { parse } = require('csv-parse');

const csvFilePath = process.argv[2];
const shouldMinify = process.argv.includes('--minify');

if (!csvFilePath) {
  console.error('Please provide the path to the CSV file as a command line argument.');
  process.exit(1);
}

fs.readFile(csvFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  parse(data, {
    columns: true,
    trim: true
  }, (err, records) => {
    if (err) {
      console.error(err);
      return;
    }

    const result = records.map(record => {
      const obj = {};

      for (const key in record) {
        if (record.hasOwnProperty(key)) {
          obj[key.trim()] = record[key].trim();
        }
      }

      return obj;
    });

    const output = shouldMinify ? JSON.stringify(result, null, 0) : result;
    console.log(output);
  });
});
