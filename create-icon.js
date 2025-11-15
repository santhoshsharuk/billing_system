const pngToIco = require('png-to-ico');
const fs = require('fs');

pngToIco('src/assets/logo.png')
  .then(buf => {
    fs.writeFileSync('src/assets/icon.ico', buf);
    console.log('✅ icon.ico created successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
