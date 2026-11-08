// 사용법: node tools/gen_images.js [글자...]   (이미 있는 파일은 건너뜀, 글자를 주면 그 글자만 다시 생성)
const fs = require('fs'), path = require('path');
const { glyph, gen, compose, close } = require('./lib.js');
const P = require('./prompts.js');
const STYLE = ', cute flat vector illustration, thick clean outlines, soft pastel colors, plain cream background, centered, no text, no letters';
const ROOT = path.join(__dirname, '..');
const vm = require('vm'); const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8') + ';this.H=HIRA;this.K=KATA', ctx);
const roma = Object.fromEntries([...ctx.H.map(x => [x[0], 'h-' + x[1]]), ...ctx.K.map(x => [x[0], 'k-' + x[1]])]);
const only = process.argv.slice(2);
(async () => {
  fs.mkdirSync(path.join(ROOT, 'img'), { recursive: true }); fs.mkdirSync(path.join(__dirname, 'raw'), { recursive: true });
  for (const [ch, [subject, color]] of Object.entries(P)) {
    const out = path.join(ROOT, 'img', roma[ch] + '.jpg');
    if (only.length ? !only.includes(ch) : fs.existsSync(out)) continue;
    const seed = +(process.env.SEED || 7);
    for (let tries = 0; ; tries++) {
      try {
        // NOINIT=1: 시작 이미지 없이 그림만 (글자 모양을 억지로 따라가며 그림이 사라지는 글자용)
        const f = process.env.NOINIT ? await gen(subject + STYLE, null, 0, seed)
          : await gen(subject + STYLE, await glyph(ch, color), +(process.env.STRENGTH || 0.22), seed);
        fs.copyFileSync(f, path.join(__dirname, 'raw', roma[ch] + '.png'));
        await compose(f, ch, out, 480);
        console.log('ok', ch, roma[ch]); break;
      } catch (e) { console.log('retry', ch, e.message); if (tries > 2) throw e; await new Promise(r => setTimeout(r, 5000)); }
    }
  }
  await close(); console.log('ALL DONE');
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
