'use strict';
// ───────── 기본 유틸 ─────────
const $ = s => document.querySelector(s);
const app = $('#app');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a).slice(0, n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ───────── 저장 ─────────
const KEY = 'kana1h-v1';
const S = Object.assign({ done: {}, stats: {}, time: 0, sound: true, best: {} }, JSON.parse(localStorage.getItem(KEY) || '{}'));
const save = () => localStorage.setItem(KEY, JSON.stringify(S));

// ───────── 글자 세트 ─────────
const mk = (arr, script) => arr.map(a => ({ q: a[0], r: a[1], k: a[2], e: a[3], m: a[4], script }));
const H = mk(HIRA, 'h'), K = mk(KATA, 'k');
H.forEach((h, i) => { h.pair = K[i].q; K[i].pair = h.q; });
const HD = mk(buildDaku(false), 'h'), KD = mk(buildDaku(true), 'k');
const HY = mk(buildYoon(false), 'h'), KY = mk(buildYoon(true), 'k');
const mkW = (arr, script) => arr.map(w => ({ q: w[0], r: w[1], k: w[2], mean: w[3], word: true, script, m: `뜻: <b>${w[3]}</b>` }));
const WH = mkW(WORDS_H, 'h'), WK = mkW(WORDS_K, 'k');
const ALL = [...H, ...K, ...HD, ...KD, ...HY, ...KY, ...WH, ...WK];
const byQ = Object.fromEntries(ALL.map(x => [x.q, x]));

// ───────── 커리큘럼 ─────────
const ROWS = [[0, 5], [5, 10], [10, 15], [15, 20], [20, 25], [25, 30], [30, 35], [35, 43], [43, 46]];
const ROWNAME = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や·ら', 'わ·を·ん'];
const withCands = (items, cands) => items.map(it => ({ it, cands }));

const PAGES = {
  h0: [
    `<h2>⏱ 1시간 완성 전략</h2>
     <p>이 앱은 기억 과학에서 검증된 방법을 <b>전부</b> 섞었습니다.</p>
     <ul>
      <li>🖼 <b>형상 기억</b> — 글자 모양 → 그림 → 소리를 이야기로 연결</li>
      <li>🧠 <b>인출 연습</b> — 보자마자 바로 퀴즈. 떠올리는 순간 기억이 굳어요</li>
      <li>🔁 <b>간격 반복</b> — 3행마다 복습, 틀린 글자는 더 자주 나와요</li>
      <li>🔊 <b>다감각</b> — 소리 듣고 · 따라 말하고 · 손가락으로 따라 쓰기</li>
      <li>⚖️ <b>헷갈림 대비</b> — 비슷한 글자를 일부러 보기로 붙여서 구분 훈련</li>
     </ul>
     <p class="tip">레슨 하나 = 약 2분. 카드의 이야기를 <b>소리 내어</b> 읽으면 효과가 2배!</p>`,
    `<h2>🔤 소리는 외울 필요가 없다</h2>
     <p>일본어 글자는 <b>자음 10줄 × 모음 5개</b> 표(50음도)로 되어 있어요.</p>
     <div class="vowels"><span>a<small>아</small></span><span>i<small>이</small></span><span>u<small>우</small></span><span>e<small>에</small></span><span>o<small>오</small></span></div>
     <p>줄(행) 순서는 노래처럼 외우세요:</p>
     <p class="chant">아 카 사 타 나 · 하 마 야 라 와 · ㄴ</p>
     <p>예) か행 = k + 모음 → <b>카 키 쿠 케 코</b>. 즉 외울 건 <b>모양</b>뿐!</p>`,
    `<h2>⚠️ 규칙에서 벗어나는 소리 6개만 조심</h2>
     <table class="rule"><tr><td lang="ja">し</td><td>si ❌ → <b>shi 시</b></td></tr>
     <tr><td lang="ja">ち</td><td>ti ❌ → <b>chi 치</b></td></tr>
     <tr><td lang="ja">つ</td><td>tu ❌ → <b>tsu 츠</b></td></tr>
     <tr><td lang="ja">ふ</td><td>hu ❌ → <b>fu 후</b></td></tr>
     <tr><td lang="ja">を</td><td>wo로 쓰지만 소리는 <b>오</b></td></tr>
     <tr><td lang="ja">ん</td><td>유일한 자음 단독 글자 <b>n 응/ㄴ</b></td></tr></table>
     <p class="tip">이제 시작! 카드 → 퀴즈(각 글자 2번 맞히면 통과) 순서로 진행됩니다.</p>`
  ],
  hD: [
    `<h2>゛ 점 두 개 = 탁한 소리</h2>
     <p>새 글자를 외울 필요 없어요. <b>규칙 하나</b>면 25자가 공짜!</p>
     <table class="rule">
      <tr><td lang="ja">か→が</td><td>k → <b>g</b> (카→가)</td></tr>
      <tr><td lang="ja">さ→ざ</td><td>s → <b>z</b> (사→자)</td></tr>
      <tr><td lang="ja">た→だ</td><td>t → <b>d</b> (타→다)</td></tr>
      <tr><td lang="ja">は→ば</td><td>h → <b>b</b> (하→바)</td></tr>
     </table>
     <h2>゜ 동그라미 = 터지는 소리</h2>
     <table class="rule"><tr><td lang="ja">は→ぱ</td><td>h → <b>p</b> (하→파) · は행에만 붙어요</td></tr></table>
     <p class="tip">외우기: 점 두 개는 "목을 울리는 진동 ∵", 동그라미는 "풍선 팡! ○"</p>`,
    `<h2>예외 3개</h2>
     <table class="rule">
      <tr><td lang="ja">じ</td><td>zi ❌ → <b>ji 지</b></td></tr>
      <tr><td lang="ja">ぢ</td><td><b>ji 지</b> (じ와 같은 소리, 드물게 씀)</td></tr>
      <tr><td lang="ja">づ</td><td><b>zu 즈</b> (ず와 같은 소리, 드물게 씀)</td></tr>
     </table>`
  ],
  hY: [
    `<h2>작은 ゃ ゅ ょ = 요음</h2>
     <p>い단 글자(き し ち に ひ み り…) 뒤에 <b>작게</b> 붙으면 한 박자로 합쳐져요.</p>
     <table class="rule">
      <tr><td lang="ja">き+ゃ</td><td><b>きゃ kya 캬</b></td></tr>
      <tr><td lang="ja">し+ゅ</td><td><b>しゅ shu 슈</b></td></tr>
      <tr><td lang="ja">ち+ょ</td><td><b>ちょ cho 쵸</b></td></tr>
     </table>
     <p class="tip">크게 쓰면 따로 읽어요: きや = ki-ya 키야 / きゃ = kya 캬</p>`,
    `<h2>작은 っ = 받침(한 박자 멈춤)</h2>
     <p>다음 글자의 자음을 <b>받침</b>으로 당겨와요.</p>
     <table class="rule">
      <tr><td lang="ja">きって</td><td>ki-t-te <b>킷테</b> (우표)</td></tr>
      <tr><td lang="ja">ざっし</td><td>za-s-shi <b>잣시</b> (잡지)</td></tr>
     </table>
     <h2>장음 = 모음 길게</h2>
     <table class="rule">
      <tr><td lang="ja">おかあさん</td><td>오카-상 (어머니)</td></tr>
      <tr><td lang="ja">とうきょう</td><td>토-쿄- (う가 앞 모음을 늘림)</td></tr>
     </table>`
  ],
  k0: [
    `<h2>🎉 소리는 이미 다 안다!</h2>
     <p>가타카나는 <b>외래어·외국 이름·강조</b>에 쓰는 글자. 소리는 히라가나와 <b>100% 같아요</b>.</p>
     <p>그래서 이번엔 "이 모양 = 아까 그 히라가나"만 연결하면 끝. 히라가나보다 훨씬 빠릅니다.</p>
     <p class="tip">카드마다 짝 히라가나가 함께 나와요. 둘을 나란히 보며 연결하세요.</p>`,
    `<h2>🪞 거의 똑같은 7자 (공짜)</h2>
     <table class="pairs" lang="ja"><tr>${'カかキきセせヘへリりモもヤや'.match(/../g).map(p => `<td>${p[0]}<small>${p[1]}</small></td>`).join('')}</tr></table>
     <h2>✂️ 히라가나 일부를 딴 글자</h2>
     <table class="pairs" lang="ja"><tr>${'アあオおタたトとナなホほチちウうラらフふ'.match(/../g).map(p => `<td>${p[0]}<small>${p[1]}</small></td>`).join('')}</tr></table>
     <p class="tip">가타카나는 한자 일부를 딴 <b>각진</b> 글자, 히라가나는 한자를 흘려 쓴 <b>둥근</b> 글자예요.</p>`,
    `<h2>😱 최대 난관 미리보기: シ ツ ソ ン</h2>
     <table class="rule" lang="ja">
      <tr><td>シ shi</td><td>점이 <b>세로로</b>, 획은 아래→위 (눕는다)</td></tr>
      <tr><td>ン n</td><td>점 <b>하나</b>, 획은 아래→위 (눕는다)</td></tr>
      <tr><td>ツ tsu</td><td>점이 <b>가로로</b>, 획은 위→아래 (선다)</td></tr>
      <tr><td>ソ so</td><td>점 <b>하나</b>, 획은 위→아래 (선다)</td></tr>
     </table>
     <p class="tip">"<b>시응</b>은 누워 있고, <b>츠소</b>는 서 있다" — 이 한 줄만 기억!</p>`
  ],
  kC: [
    `<h2>⚖️ 헷갈리는 짝 총정리</h2>
     <table class="rule" lang="ja">
      <tr><td>シ / ツ</td><td>점 세로·획 위로 = シ / 점 가로·획 아래로 = ツ</td></tr>
      <tr><td>ソ / ン</td><td>획이 내려옴 = ソ / 획이 올라감 = ン</td></tr>
      <tr><td>ク / ケ / タ</td><td>ク 기본 / ケ 꼬리가 밖으로(K) / タ 안에 획</td></tr>
      <tr><td>ウ / ワ / フ</td><td>점+지붕 = ウ / 지붕만 = ワ / 갈고리만 = フ</td></tr>
      <tr><td>ス / ヌ</td><td>스키 = ス / 젓가락 하나 더 = ヌ</td></tr>
      <tr><td>コ / ユ / ロ</td><td>코너 = コ / 아래 줄 튀어나옴 = ユ / 닫힌 네모 = ロ</td></tr>
      <tr><td>チ / テ</td><td>위가 비스듬 = チ / 위가 평평 = テ</td></tr>
      <tr><td>ナ / メ</td><td>십자 = ナ / X = メ</td></tr>
      <tr><td>マ / ア</td><td>꼬리가 오른쪽 아래로 = マ / 가운데로 = ア</td></tr>
     </table>`
  ],
  kD: [
    `<h2>가타카나도 규칙은 같다</h2>
     <table class="pairs" lang="ja"><tr>${'ガがザざダだバばパぱ'.match(/../g).map(p => `<td>${p[0]}<small>${p[1]}</small></td>`).join('')}</tr></table>
     <p>요음도 같아요: <span lang="ja">キャ シュ チョ</span> = 캬 슈 쵸</p>
     <h2>ー = 길게 늘이기 (가타카나 전용)</h2>
     <table class="rule" lang="ja">
      <tr><td>コーヒー</td><td>코-히- (커피)</td></tr>
      <tr><td>ケーキ</td><td>케-키 (케이크)</td></tr>
     </table>
     <p class="tip">작은 ッ도 같은 받침 규칙: <span lang="ja">サッカー</span> = 삭카- (축구)</p>`
  ]
};

const L = [];
function rowLessons(set, script, min, prefix) {
  ROWS.forEach(([a, b], i) => {
    const cards = set.slice(a, b);
    const name = script === 'h' ? ROWNAME[i] : ROWNAME[i].replace(/./g, c => byQ[c] ? byQ[c].pair : c);
    L.push({ id: prefix + (i + 1), part: script, min, type: 'learn', title: `${name}행`, sub: cards.map(c => c.q).join(' '), cards,
      quiz: () => ({ items: withCands(cards, set.slice(0, b)), need: 2, mode: 'learn' }) });
    if (i % 3 === 2) {
      const r = i / 3 | 0;
      L.push({ id: prefix + 'R' + (r + 1), part: script, min: r === 2 ? 2 : 1.5, type: 'review', title: `🔁 복습 체크포인트 ${r + 1}`, sub: r === 2 ? '전체 46자' : `${set[0].q} ~ ${set[b - 1].q}`,
        quiz: () => {
          const pool = set.slice(0, b);
          const fresh = set.slice(ROWS[i - 2][0], b);
          const n = r === 2 ? 24 : 15;
          const pick = [...new Set([...pickWeak(fresh, Math.ceil(n * 0.6)), ...pickWeak(pool, n)])].slice(0, n);
          return { items: withCands(pick, pool), need: 1, mode: 'mix' };
        } });
    }
  });
}

L.push({ id: 'h0', part: 'h', min: 1, type: 'intro', title: '시작: 1시간 완성 전략', sub: '50음도 구조 · 예외 소리', pages: PAGES.h0 });
rowLessons(H, 'h', 2, 'h');
L.push({ id: 'hD', part: 'h', min: 2, type: 'rule', title: '゛゜ 탁음·반탁음', sub: '규칙 하나로 25자', pages: PAGES.hD,
  quiz: () => ({ items: withCands(sample(HD, 12), HD), need: 1, mode: 'mix2' }) });
L.push({ id: 'hY', part: 'h', min: 3, type: 'rule', title: 'ゃゅょ っ 요음·촉음·장음', sub: '단어 읽기 연습', pages: PAGES.hY,
  quiz: () => ({ items: [...withCands(sample(HY, 9), HY), ...withCands(sample(WH, 8), WH)], need: 1, mode: 'mix2' }) });
L.push({ id: 'hT', part: 'h', min: 3, type: 'test', title: '🏁 히라가나 최종 테스트', sub: '90% 이상이면 합격',
  quiz: () => ({ items: [...withCands(H, H), ...withCands(sample(HD, 4), HD), ...withCands(sample(HY, 3), HY)], need: 1, mode: 'test' }) });

L.push({ id: 'k0', part: 'k', min: 1, type: 'intro', title: '가타카나 시작: 이미 반은 안다', sub: '히라가나와 짝짓기', pages: PAGES.k0 });
rowLessons(K, 'k', 1.5, 'k');
L.push({ id: 'kC', part: 'k', min: 1.5, type: 'rule', title: '⚖️ 헷갈리는 글자 집중 훈련', sub: 'シツ ソン クケタ ウワフ…', pages: PAGES.kC,
  quiz: () => {
    const set = 'シツソンクケタウワフスヌコユロチテナメマア'.split('').map(c => byQ[c]);
    return { items: withCands(set, set), need: 1, mode: 'mix2' };
  } });
L.push({ id: 'kD', part: 'k', min: 1.5, type: 'rule', title: 'ガ パ キャ ー 탁음·요음·장음', sub: '히라가나와 같은 규칙', pages: PAGES.kD,
  quiz: () => ({ items: [...withCands(sample(KD, 8), KD), ...withCands(sample(KY, 6), KY)], need: 1, mode: 'mix2' }) });
L.push({ id: 'kW', part: 'k', min: 1.5, type: 'rule', title: '🍔 외래어 읽기', sub: 'コーヒー テレビ ラーメン…',
  quiz: () => ({ items: withCands(sample(WK, 14), WK), need: 1, mode: 'k2s' }) });
L.push({ id: 'kT', part: 'k', min: 2, type: 'test', title: '🏁 가타카나 최종 테스트', sub: '90% 이상이면 합격',
  quiz: () => ({ items: [...withCands(K, K), ...withCands(sample(KD, 4), KD), ...withCands(sample(WK, 3), WK)], need: 1, mode: 'test' }) });
L.push({ id: 'F', part: 'f', min: 2, type: 'test', title: '👑 마스터 테스트', sub: '히라가나 + 가타카나 랜덤 40문제',
  quiz: () => ({ items: [...withCands(pickWeak(H, 20), H), ...withCands(pickWeak(K, 20), K)], need: 1, mode: 'test' }) });

const TOTAL_MIN = L.reduce((s, l) => s + l.min, 0);
const PARTS = { h: '1부 · 히라가나 ひらがな', k: '2부 · 가타카나 カタカナ', f: '마무리' };

// ───────── 약점 점수 ─────────
function weak(it) {
  const s = S.stats[it.q];
  if (!s) return 2 + Math.random();
  return s[1] * 3 - s[0] + Math.random() * 1.5;
}
const pickWeak = (pool, n) => shuffle(pool).sort((a, b) => weak(b) - weak(a)).slice(0, n);

// ───────── 소리 ─────────
let jaVoice = null;
function loadVoices() {
  const vs = speechSynthesis.getVoices().filter(v => /^ja/i.test(v.lang));
  jaVoice = vs.find(v => /google|kyoko|otoya|o-ren|natural/i.test(v.name)) || vs[0] || null;
}
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function say(text) {
  if (!S.sound || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP'; u.rate = 0.8;
  if (jaVoice) u.voice = jaVoice;
  speechSynthesis.speak(u);
}

// ───────── 타이머 ─────────
let screen = 'home', tick = 0;
setInterval(() => {
  if ((screen === 'lesson' || screen === 'quiz') && document.visibilityState === 'visible') {
    S.time++; if (++tick % 5 === 0) save();
    const t = $('#clock'); if (t) t.textContent = fmt(S.time);
  }
}, 1000);

const topbar = (title) => `<header class="top"><button class="icon" onclick="A.home()" aria-label="홈">✕</button><div class="ttl">${title}</div><div class="clock">⏱ <span id="clock">${fmt(S.time)}</span></div></header>`;

// ───────── 홈 ─────────
const isDone = id => !!S.done[id];
const nextLesson = () => L.find(l => !isDone(l.id));
function home() {
  screen = 'home'; save();
  const done = L.filter(l => isDone(l.id)).length;
  const pct = Math.round(done / L.length * 100);
  const nx = nextLesson();
  let html = `<div class="hero">
      <div class="brand"><span lang="ja">あ</span><span lang="ja" class="kt">ア</span></div>
      <h1>가나 1시간 완성</h1>
      <p>히라가나 · 가타카나 92자 + 탁음 · 요음 · 외래어</p>
      <div class="meter"><i style="width:${pct}%"></i></div>
      <div class="stat"><span>진도 <b>${pct}%</b> (${done}/${L.length})</span><span>공부 시간 <b>${fmt(S.time)}</b> / 목표 ${TOTAL_MIN}분</span></div>
      ${nx ? `<button class="big" onclick="A.open('${nx.id}')">${done ? '이어서 학습' : '지금 시작하기'} ▶<small>${esc(nx.title)}</small></button>` : `<div class="trophy">🏆 전 과정 완료! 복습 탭에서 약점을 다듬어 보세요.</div>`}
      <div id="install"></div>
    </div>`;
  let part = '';
  L.forEach((l, i) => {
    if (l.part !== part) { if (part) html += '</div>'; part = l.part; html += `<h3 class="part">${PARTS[part]}</h3><div class="list">`; }
    const st = isDone(l.id) ? 'done' : (nx && nx.id === l.id ? 'next' : '');
    const best = S.best[l.id] != null ? ` · 최고 ${S.best[l.id]}%` : '';
    html += `<button class="lesson ${st} ${l.type}" onclick="A.open('${l.id}')">
        <span class="no">${isDone(l.id) ? '✓' : i + 1}</span>
        <span class="lt"><b>${esc(l.title)}</b><small lang="ja">${esc(l.sub)}</small></span>
        <span class="min">${l.min}분${best}</span></button>`;
  });
  html += '</div>' + navbar('home');
  app.innerHTML = html;
  renderInstall();
}
const navbar = cur => `<nav class="nav">
  <button class="${cur === 'home' ? 'on' : ''}" onclick="A.home()">📚<small>학습</small></button>
  <button class="${cur === 'chart' ? 'on' : ''}" onclick="A.chart('h')">🗂<small>50음도</small></button>
  <button class="${cur === 'review' ? 'on' : ''}" onclick="A.review()">🔁<small>약점 복습</small></button>
  <button class="${cur === 'set' ? 'on' : ''}" onclick="A.settings()">⚙️<small>설정</small></button></nav>`;

// ───────── 레슨 진입 ─────────
let cur = null;
function open(id) {
  const l = L.find(x => x.id === id);
  cur = { lesson: l, step: 0 };
  if (l.type === 'learn') return showCard();
  if (l.pages) return showPage();
  startQuiz(l.quiz(), l);
}

function showPage() {
  screen = 'lesson';
  const l = cur.lesson, p = l.pages, i = cur.step;
  app.innerHTML = topbar(esc(l.title)) + `<main class="page">${p[i]}</main>
    <div class="dots">${p.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
    <footer class="act">${i > 0 ? `<button class="ghost" onclick="A.pg(-1)">◀ 이전</button>` : '<span></span>'}
    <button class="primary" onclick="A.pg(1)">${i < p.length - 1 ? '다음 ▶' : (l.quiz ? '퀴즈 시작 ▶' : '완료 ✓')}</button></footer>`;
}
function pg(d) {
  const l = cur.lesson;
  cur.step += d;
  if (cur.step >= l.pages.length) {
    if (l.quiz) return startQuiz(l.quiz(), l);
    S.done[l.id] = true; save(); return afterLesson(l);
  }
  showPage();
}
function afterLesson(l) {
  const i = L.indexOf(l), nx = L[i + 1];
  if (nx) open(nx.id); else home();
}

// ───────── 글자 카드 ─────────
function cardHTML(it) {
  const pair = it.script === 'k' && it.pair ? `<div class="pair">히라가나 짝 <b lang="ja">${it.pair}</b></div>` : '';
  return `<div class="card ${it.script}">
    <div class="trace"><div class="ghostc len${Math.min(it.q.length, 6)}" lang="ja">${it.q}</div><canvas></canvas><button class="clr" onclick="A.clear(this)" title="지우기">↺</button></div>
    <div class="read"><span class="rom">${it.r}</span><span class="kor">${it.k}</span><button class="spk" onclick="A.say('${it.q}')">🔊</button></div>
    <div class="mn">${it.e ? `<span class="emo">${it.e}</span>` : ''}<p>${it.m}</p></div>${pair}
    <p class="hint">✍️ 위 글자를 손가락으로 따라 써 보세요 · 이야기를 소리 내어 읽기</p></div>`;
}
function showCard() {
  screen = 'lesson';
  const l = cur.lesson, cs = l.cards, i = cur.step, it = cs[i];
  app.innerHTML = topbar(`${esc(l.title)} <small>${i + 1}/${cs.length}</small>`) + `<main>${cardHTML(it)}</main>
    <div class="dots">${cs.map((c, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
    <footer class="act">${i > 0 ? `<button class="ghost" onclick="A.cd(-1)">◀ 이전</button>` : '<span></span>'}
    <button class="primary" onclick="A.cd(1)">${i < cs.length - 1 ? '다음 글자 ▶' : '퀴즈 시작 ▶'}</button></footer>`;
  initTrace();
  say(it.q);
}
function cd(d) {
  cur.step += d;
  if (cur.step >= cur.lesson.cards.length) return startQuiz(cur.lesson.quiz(), cur.lesson);
  showCard();
}
function initTrace() {
  document.querySelectorAll('.trace canvas').forEach(cv => {
    const r = cv.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr); g.lineCap = g.lineJoin = 'round'; g.lineWidth = Math.max(8, r.width / 22); g.strokeStyle = '#e5484d';
    let down = false;
    const pt = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    cv.onpointerdown = e => { down = true; cv.setPointerCapture(e.pointerId); g.beginPath(); g.moveTo(...pt(e)); g.lineTo(...pt(e)); g.stroke(); };
    cv.onpointermove = e => { if (!down) return; g.lineTo(...pt(e)); g.stroke(); };
    cv.onpointerup = cv.onpointercancel = () => { down = false; };
  });
}
function clear(btn) { const cv = btn.parentNode.querySelector('canvas'); cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); }

// ───────── 퀴즈 엔진 ─────────
let Q = null;
function startQuiz(cfg, lesson) {
  const queue = shuffle(cfg.items).map(x => ({ ...x, left: cfg.need, n: 0 }));
  Q = { cfg, lesson, queue, total: queue.length * cfg.need, gained: 0, right: 0, wrong: 0, miss: [], t0: S.time, cur: null, locked: false };
  nextQ();
}
function pickMode(e) {
  const m = Q.cfg.mode, w = e.it.word;
  if (w || m === 'k2s') return 'k2s';
  if (m === 'learn') return e.n % 2 === 0 ? 'k2s' : 's2k';
  if (m === 'mix2') return Math.random() < 0.6 ? 'k2s' : 's2k';
  if (m === 'test') return Math.random() < 0.5 ? 'type' : (Math.random() < 0.7 ? 'k2s' : 's2k');
  const x = Math.random(); return x < 0.45 ? 'k2s' : x < 0.75 ? 's2k' : 'type';
}
const groupOf = q => SIMILAR.filter(g => g.includes(q)).join('');
function choicesFor(e) {
  const it = e.it;
  let c = e.cands.filter(x => x.q !== it.q && x.r !== it.r);
  const g = groupOf(it.q);
  const sim = shuffle(c.filter(x => g.includes(x.q))).slice(0, 2);
  const out = [it, ...sim];
  for (const x of shuffle(c)) { if (out.length >= 4) break; if (!out.some(o => o.r === x.r)) out.push(x); }
  return shuffle(out);
}
const label = it => it.word ? `<span class="kor">${it.k}</span><small>${it.mean}</small>` : `<span class="rom">${it.r}</span><span class="kor">${it.k}</span>`;

function nextQ() {
  screen = 'quiz';
  if (!Q.queue.length) return finishQuiz();
  const e = Q.cur = Q.queue.shift();
  e.mode = pickMode(e);
  Q.locked = false;
  const it = e.it, pct = Math.round(Q.gained / Q.total * 100);
  let body = '';
  if (e.mode === 'type') {
    body = `<div class="prompt"><div class="kana ${it.word ? 'word' : ''}" lang="ja">${it.q}</div><p>읽는 법을 입력 (로마자 또는 한글)</p></div>
      <form class="typer" onsubmit="A.typed(event)"><input id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="예: ka 또는 카" enterkeyhint="done">
      <button class="primary">확인</button></form><button class="ghost wide" onclick="A.typed(null)">모르겠어요</button>`;
  } else {
    e.opts = choicesFor(e);
    const s2k = e.mode === 's2k';
    body = `<div class="prompt">${s2k
      ? `<div class="sound" onclick="A.say('${it.q}')">🔊</div><div class="readq">${label(it)}</div><p>이 소리의 글자는?</p>`
      : `<div class="kana ${it.word ? 'word' : ''}" lang="ja">${it.q}</div><p>${it.word ? '어떻게 읽을까?' : '이 글자의 소리는?'}</p>`}</div>
      <div class="choices ${s2k ? 'kanas' : ''}">${e.opts.map((o, i) => `<button data-i="${i}" onclick="A.pick(${i})">${s2k ? `<span lang="ja">${o.q}</span>` : label(o)}<kbd>${i + 1}</kbd></button>`).join('')}</div>`;
    if (s2k) say(it.q);
  }
  app.innerHTML = topbar(esc(Q.lesson ? Q.lesson.title : '약점 복습')) +
    `<div class="qbar"><i style="width:${pct}%"></i></div><div class="score">✅ ${Q.right} · ❌ ${Q.wrong} · 남은 ${Q.queue.length + 1}</div>
    <main class="quiz">${body}<div id="fb"></div></main>`;
  const inp = $('#ans'); if (inp) inp.focus();
}

function accepts(it) {
  const n = s => s.toLowerCase().replace(/[\s\-·ー~()]/g, '');
  const r = it.r, set = new Set([r, it.k, ...(ALT[it.q] || [])]);
  [[/shi/, 'si'], [/chi/, 'ti'], [/tsu/, 'tu'], [/fu/, 'hu'], [/^ji$/, 'zi'], [/^sh/, 'sy'], [/^ch/, 'ty'], [/^ch/, 'cy'], [/^j(?=[auo]$)/, 'jy'], [/^j(?=[auo]$)/, 'zy'], [/^wo$/, 'o'], [/^n$/, 'nn']]
    .forEach(([a, b]) => { if (a.test(r)) set.add(r.replace(a, b)); });
  return { ok: v => [...set].map(n).includes(n(v)) };
}
function typed(ev) {
  if (ev) ev.preventDefault();
  if (Q.locked) return;
  const v = ev ? $('#ans').value.trim() : '';
  if (ev && !v) return;
  answer(v && accepts(Q.cur.it).ok(v), null);
}
function pick(i) {
  if (Q.locked) return;
  const e = Q.cur, o = e.opts[i];
  const btns = document.querySelectorAll('.choices button');
  const ri = e.opts.indexOf(e.it);
  btns[ri].classList.add('right');
  if (o !== e.it) btns[i].classList.add('wrong');
  answer(o === e.it, o);
}
function answer(ok, chosen) {
  Q.locked = true;
  const e = Q.cur, it = e.it, st = S.stats[it.q] || (S.stats[it.q] = [0, 0]);
  e.n++;
  if (ok) {
    st[0]++; Q.right++; Q.gained++; e.left--;
    if (e.left > 0) Q.queue.splice(Math.min(Q.queue.length, 2 + (Math.random() * 3 | 0)), 0, e);
    say(it.q); save();
    $('#fb').innerHTML = `<div class="ok">정답! <b lang="ja">${it.q}</b> = ${it.r} ${it.k}</div>`;
    setTimeout(nextQ, it.word ? 900 : 650);
    return;
  }
  st[1]++; Q.wrong++; save();
  if (!Q.miss.includes(it)) Q.miss.push(it);
  if (Q.cfg.mode !== 'test') {
    // 틀리면 같은 글자를 곧 다시 + 한 번 더 맞혀야 통과
    if (e.left < Q.cfg.need + 1) { e.left++; Q.total++; }
    Q.queue.splice(Math.min(Q.queue.length, 2), 0, e);
  }
  const conf = chosen && chosen !== it ? `<p class="conf">고른 것: <b lang="ja">${chosen.q}</b> = ${chosen.r} ${chosen.k}</p>` : '';
  say(it.q);
  $('#fb').innerHTML = `<div class="ng"><div class="ngk" lang="ja">${it.q}</div><div class="ngr">${label(it)}</div>
    <div class="mn">${it.e ? `<span class="emo">${it.e}</span>` : ''}<p>${it.m}</p></div>${conf}
    <button class="primary wide" id="go" onclick="A.next()">알겠어요 ▶</button></div>`;
  $('#go').focus();
}

function finishQuiz() {
  const l = Q.lesson, isTest = Q.cfg.mode === 'test';
  const acc = Math.round(Q.right / Math.max(1, Q.right + Q.wrong) * 100);
  const passed = !isTest || acc >= 90;
  if (l) {
    if (passed) S.done[l.id] = true;
    if (isTest) S.best[l.id] = Math.max(S.best[l.id] || 0, acc);
  }
  save(); screen = 'result';
  const sec = S.time - Q.t0;
  const idx = l ? L.indexOf(l) : -1, nx = idx >= 0 ? L[idx + 1] : null;
  const msg = isTest ? (passed ? '🎉 합격! 완벽하게 외웠어요' : '😅 90% 이상이면 합격! 틀린 글자만 다시 다지고 재도전') : (acc === 100 ? '🌟 퍼펙트!' : '👍 완료! 틀린 글자는 자동으로 더 자주 나와요');
  app.innerHTML = topbar('결과') + `<main class="result">
    <div class="acc ${passed ? 'pass' : 'fail'}">${acc}<small>%</small></div><p class="msg">${msg}</p>
    <p class="sub">정답 ${Q.right} · 오답 ${Q.wrong} · ${fmt(sec)} 소요</p>
    ${Q.miss.length ? `<h4>틀린 글자 (눌러서 다시 보기)</h4><div class="chips">${Q.miss.map(m => `<button lang="ja" onclick="A.peek('${m.q}')">${m.q}<small>${m.r}</small></button>`).join('')}</div>` : ''}
    <div class="col">
      ${passed && nx ? `<button class="primary wide" onclick="A.open('${nx.id}')">다음: ${esc(nx.title)} ▶</button>` : ''}
      ${passed && l && !nx ? `<div class="trophy">🏆 1시간 과정 완주! 총 공부 시간 ${fmt(S.time)}</div>` : ''}
      ${Q.miss.length ? `<button class="${passed ? 'ghost' : 'primary'} wide" onclick="A.drill()">틀린 것만 연습 (${Q.miss.length})</button>` : ''}
      ${l ? `<button class="ghost wide" onclick="A.open('${l.id}')">다시 하기</button>` : ''}
      <button class="ghost wide" onclick="A.home()">홈으로</button></div></main>`;
}
function drill() {
  const miss = Q.miss, lesson = Q.lesson && Q.cfg.mode === 'test' ? null : Q.lesson;
  startQuiz({ items: miss.map(it => ({ it, cands: poolOf(it) })), need: 2, mode: 'learn' }, lesson);
}
const poolOf = it => [H, K, HD, KD, HY, KY, WH, WK].find(s => s.includes(it));

// ───────── 약점 복습 ─────────
function review() {
  const learned = new Set();
  L.forEach(l => { if (isDone(l.id) && l.cards) l.cards.forEach(c => learned.add(c)); });
  Object.keys(S.stats).forEach(q => byQ[q] && learned.add(byQ[q]));
  if (learned.size < 4) {
    screen = 'review';
    app.innerHTML = `<main class="page"><h2>🔁 약점 복습</h2><p>아직 배운 글자가 적어요. 학습 탭에서 첫 레슨부터 시작해 보세요!</p></main>` + navbar('review');
    return;
  }
  const pick = pickWeak([...learned], 15);
  startQuiz({ items: pick.map(it => ({ it, cands: poolOf(it) })), need: 1, mode: 'mix' }, null);
}

// ───────── 50음도 표 ─────────
function chart(script) {
  screen = 'chart';
  const set = script === 'h' ? H : K;
  const cell = it => {
    const s = S.stats[it.q]; let c = 'new';
    if (s) c = s[0] / (s[0] + s[1]) >= 0.8 ? 'good' : 'weak';
    return `<button class="cell ${c}" onclick="A.peek('${it.q}')"><span lang="ja">${it.q}</span><small>${it.r}</small></button>`;
  };
  const extra = (arr) => `<div class="grid g5">${arr.map(cell).join('')}</div>`;
  app.innerHTML = `<header class="top"><div class="ttl">50음도</div></header>
    <div class="tabs"><button class="${script === 'h' ? 'on' : ''}" onclick="A.chart('h')" lang="ja">ひらがな</button><button class="${script === 'k' ? 'on' : ''}" onclick="A.chart('k')" lang="ja">カタカナ</button></div>
    <p class="legend"><i class="good"></i>잘 앎 <i class="weak"></i>약함 <i class="new"></i>안 해봄 · 글자를 누르면 기억법</p>
    <div class="grid g5">${GRID.flat().map(i => i == null ? '<span></span>' : cell(set[i])).join('')}</div>
    <h3 class="part">탁음 · 반탁음</h3>${extra(script === 'h' ? HD : KD)}
    <h3 class="part">요음</h3><div class="grid g3">${(script === 'h' ? HY : KY).map(cell).join('')}</div>` + navbar('chart');
}
function peek(q) {
  const it = byQ[q];
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="sheet">${cardHTML(it)}<button class="primary wide" onclick="this.closest('.modal').remove()">닫기</button></div>`;
  m.onclick = e => { if (e.target === m) m.remove(); };
  document.body.appendChild(m);
  initTrace(); say(it.q);
}

// ───────── 설정 ─────────
function settings() {
  screen = 'set';
  app.innerHTML = `<main class="page"><h2>⚙️ 설정</h2>
    <label class="row"><span>🔊 발음 소리</span><input type="checkbox" ${S.sound ? 'checked' : ''} onchange="A.snd(this.checked)"></label>
    <p class="sub">${'speechSynthesis' in window ? (jaVoice ? `일본어 음성: ${esc(jaVoice.name)}` : '일본어 음성을 찾지 못했어요. 기기 설정에서 일본어 TTS 음성을 설치하면 발음이 나와요.') : '이 브라우저는 음성 합성을 지원하지 않아요.'}</p>
    <div id="install"></div>
    <button class="ghost wide danger" onclick="A.reset()">진도 · 기록 초기화</button>
    <h3>📖 이 앱의 학습법</h3>
    <p class="sub">형상 기억(그림 이야기) → 즉시 인출 퀴즈 → 간격 반복 복습 → 헷갈리는 글자 대비 보기 → 타이핑 테스트 순서로, 1시간 안에 92자의 소리를 장기 기억으로 옮기도록 설계했습니다.</p></main>` + navbar('set');
  renderInstall();
}
function reset() { if (confirm('모든 진도와 기록을 지울까요?')) { localStorage.removeItem(KEY); location.reload(); } }

// ───────── 설치 (PWA) ─────────
let deferred = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; renderInstall(); });
addEventListener('appinstalled', () => { deferred = null; renderInstall(); });
function renderInstall() {
  const box = $('#install'); if (!box) return;
  if (standalone()) { box.innerHTML = ''; return; }
  if (deferred || isIOS) box.innerHTML = `<button class="install" onclick="A.install()">📲 홈 화면에 앱 설치</button>`;
  else box.innerHTML = '';
}
async function install() {
  if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; renderInstall(); return; }
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="sheet page"><h2>📲 iPhone · iPad 설치</h2><ol><li>Safari 아래(또는 위)의 <b>공유 버튼</b> <span class="ios">⎋</span> 누르기</li><li><b>홈 화면에 추가</b> 선택</li><li>오른쪽 위 <b>추가</b></li></ol><p class="sub">설치하면 오프라인에서도 앱처럼 실행돼요.</p><button class="primary wide" onclick="this.closest('.modal').remove()">확인</button></div>`;
  document.body.appendChild(m);
}

// ───────── 키보드 ─────────
addEventListener('keydown', e => {
  if (screen !== 'quiz' || !Q) return;
  if (!Q.locked && /^[1-4]$/.test(e.key) && Q.cur.opts && Q.cur.mode !== 'type') pick(+e.key - 1);
  else if (Q.locked && e.key === 'Enter' && $('#go')) { e.preventDefault(); nextQ(); }
});

window.A = { home, open, pg, cd, say, clear, pick, typed, next: nextQ, drill, review, chart, peek, settings, reset, install,
  snd: v => { S.sound = v; save(); } };

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
home();
