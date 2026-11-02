# scripts/staff/render_pages.py
# PDF → 페이지별 WebP 이미지 (자료 담당 materials.mjs 가 호출)
#   무료 자료는 PDF 원본을 배포하지 않고 '화면에서 보기'만 제공한다 → 페이지를 이미지로 구워 올린다.
#   엔진: pypdfium2 (Chrome 의 PDFium, Apache-2.0/BSD-3) — 임베드된 한글 폰트를 그대로 렌더링.
#   설치: pip install pypdfium2 pillow
#   사용: python scripts/staff/render_pages.py <in.pdf> <out_dir> [width=1240]
#   출력: out_dir/p001.webp … , stdout 에 생성된 페이지 수
import sys
from pathlib import Path

import pypdfium2 as pdfium

src, out_dir = sys.argv[1], Path(sys.argv[2])
width = int(sys.argv[3]) if len(sys.argv) > 3 else 1240
out_dir.mkdir(parents=True, exist_ok=True)

pdf = pdfium.PdfDocument(src)
for i, page in enumerate(pdf, start=1):
    scale = width / page.get_width()  # 포인트 → 목표 폭(px)
    image = page.render(scale=scale).to_pil().convert("RGB")
    image.save(out_dir / f"p{i:03d}.webp", "WEBP", quality=82, method=6)
print(len(pdf))
