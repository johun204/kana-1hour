// raw/ 그림에서 덧그림만 다시 입히기: node tools/recompose.js
const fs = require('fs'), path = require('path');
const { compose, close } = require('./lib.js');
const P = require('./prompts.js');
const vm = require('vm'); const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8') + ';this.H=HIRA;this.K=KATA', ctx);
const roma = Object.fromEntries([...ctx.H.map(x => [x[0], 'h-' + x[1]]), ...ctx.K.map(x => [x[0], 'k-' + x[1]])]);
(async () => { for (const ch of Object.keys(P)) { const r = path.join(__dirname, 'raw', roma[ch] + '.png'); if (fs.existsSync(r)) await compose(r, ch, path.join(__dirname, '../img', roma[ch] + '.jpg'), 480); } await close(); })();
