// 책 부록 오디오 클립 파일명 체크리스트 생성기
//
// public/book1/index.html 안의 D 배열을 그대로 읽어, 플레이어가 기대하는
// clips/pXX-YY.mp3 파일명 전체 목록을 뽑아 public/book1/clips/_EXPECTED_FILES.txt 로 저장한다.
// 녹음 파일 이름을 이 목록에 정확히 맞춰 public/book1/clips/ 에 올리면 된다.
//
//   node scripts/book1-clips-manifest.cjs
//
// 콘텐츠(페이지·클립)를 index.html 에서 수정하면 이 스크립트를 다시 돌려 목록을 갱신한다.

const fs = require('fs')
const path = require('path')

const htmlPath = path.join(__dirname, '..', 'public', 'book1', 'index.html')
const outPath = path.join(__dirname, '..', 'public', 'book1', 'clips', '_EXPECTED_FILES.txt')

const html = fs.readFileSync(htmlPath, 'utf8')

// index.html 의 `const D=[ ... ];` 블록만 안전하게 잘라내 평가한다.
const m = html.match(/const\s+D\s*=\s*(\[[\s\S]*?\]);/)
if (!m) {
  console.error('D 배열을 index.html 에서 찾지 못했습니다.')
  process.exit(1)
}
// eslint-disable-next-line no-eval
const D = eval(m[1])

const pad = n => String(n).padStart(2, '0')

const lines = []
let total = 0
for (const [pg, , title, kr, clips] of D) {
  lines.push('')
  lines.push(`# p.${pg}  ${title}  (${kr})  — ${clips.length} clips`)
  clips.forEach((lab, i) => {
    const name = `clips/p${pad(pg)}-${pad(i + 1)}.mp3`
    lines.push(`${name}\t${lab.replace('⚠', '').trim()}`)
    total++
  })
}

const header = [
  `# book1 오디오 클립 예상 파일명 — 총 ${total}개`,
  `# 생성: ${new Date().toISOString()}`,
  `# 위치: public/book1/clips/  (플레이어에서 /book1/clips/pXX-YY.mp3 로 서빙)`,
  `# 형식:  파일경로 <TAB> 해당 클립 라벨`,
].join('\n')

fs.writeFileSync(outPath, header + '\n' + lines.join('\n') + '\n', 'utf8')
console.log(`총 ${total}개 클립 → ${path.relative(path.join(__dirname, '..'), outPath)} 저장 완료`)
