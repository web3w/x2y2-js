const fs = require('fs');
const f = 'node_modules/react-scripts/config/webpack.config.js';

fs.readFile(f, 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    let result = data.replace(/node: false/g, 'node: {crypto: true, stream: true}');

    fs.writeFile(f, result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});
