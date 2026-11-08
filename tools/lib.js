// 그림 생성 도구 공용 함수 (로컬 MLX 이미지 서버 + 헤드리스 Chrome)
const fs = require('fs');
const { chromium } = require(process.env.PW || '/Library/Claude/ai-browser-ext/node_modules/playwright-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const API = process.env.MLX_URL || 'http://127.0.0.1:7860';
const KEY = fs.readFileSync(process.env.HOME + '/.local/share/mlx-image/api_key', 'utf8').trim();
const vm = require('vm'), path = require('path');
const SC = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../strokes.js'), 'utf8') + ';this.S=STROKES', SC);
const svg = (ch, layers) => `<svg viewBox="0 0 109 109" style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke-linecap="round" stroke-linejoin="round">${layers.map(([c, w]) => SC.S[ch].map(d => `<path d="${d}" stroke="${c}" stroke-width="${w}"/>`).join('')).join('')}</svg>`;
const FONT = "'Hiragino Maru Gothic ProN','Hiragino Sans',sans-serif";

let browser;
async function page(w, h) {
  browser = browser || await chromium.launch({ executablePath: CHROME });
  return browser.newPage({ viewport: { width: w, height: h } });
}
const close = () => browser && browser.close();

// 1) img2img 시작 이미지: 크림 배경 위 굵은 글자
async function glyph(ch, color, size = 768) {
  const p = await page(size, size);
  await p.setContent(`<body style="margin:0;width:${size}px;height:${size}px;position:relative;background:#fbf3e4">${svg(ch, [[color, 10]])}</body>`);
  const b = await p.screenshot({ type: 'png' }); await p.close(); return b;
}

// 2) 서버에 작업 제출 → 완료까지 대기 → PNG 경로
async function gen(prompt, init, strength, seed = 7, size = '768x768') {
  const body = { prompt, size, seed, model: 'z-image-turbo' };
  if (init) Object.assign(body, { init_image: init.toString('base64'), image_strength: strength });
  const h = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
  let j = await (await fetch(`${API}/v1/jobs`, { method: 'POST', headers: h, body: JSON.stringify(body) })).json();
  if (!j.id) throw new Error(JSON.stringify(j));
  while (!['done', 'error'].includes(j.status)) {
    await new Promise(r => setTimeout(r, 2000));
    j = await (await fetch(`${API}/v1/jobs/${j.id}`, { headers: h })).json();
  }
  if (j.status === 'error') throw new Error(j.error);
  return process.env.HOME + '/Pictures/MLX-Image/' + j.result.file;
}

// 3) 생성 그림 위에 가나를 덧그린 최종 카드 이미지
async function compose(imgPath, ch, out, size = 512) {
  const p = await page(size, size);
  const src = 'data:image/png;base64,' + fs.readFileSync(imgPath).toString('base64');
  await p.setContent(`<body style="margin:0;width:${size}px;height:${size}px;position:relative;overflow:hidden">
    <img src="${src}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
    ${svg(ch, [['rgba(255,255,255,.9)', 4.2], ['#e5484d', 2.2]])}</body>`);
  await p.waitForTimeout(50);
  await p.screenshot({ path: out, type: 'jpeg', quality: 82 }); await p.close();
}
module.exports = { glyph, gen, compose, close };
