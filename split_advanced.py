"""
split_advanced.py
=================
두 개의 Advanced MP3 통파일을 문장 단위로 분할합니다.

처리 순서: advanced 1.mp3 → advanced 2.mp3 (번호 연속)
출력 위치: C:\k_listen_master\public\audio\Advanced\adv_01.mp3 ~
전처리: 앞부분 무음 Trim → 정확히 0.5초 여백 삽입 (중급과 동일)
"""

import os, re, subprocess, imageio_ffmpeg

FFMPEG   = imageio_ffmpeg.get_ffmpeg_exe()
SRC_DIR  = r"C:\k_listen_master\assets\audio"
OUT_DIR  = r"C:\k_listen_master\public\audio\Advanced"
os.makedirs(OUT_DIR, exist_ok=True)

SILENCE_DB      = "-40dB"
MIN_SILENCE_SEC = 0.7   # 이 이상의 무음만 문장 경계로 인식
MIN_SEG_SEC     = 1.2   # 이보다 짧은 세그먼트는 제외 (잡음/여백 방지)
DELAY_MS        = 500   # 앞부분 0.5초 여백

SOURCE_FILES = [
    os.path.join(SRC_DIR, "advanced 1.mp3"),
    os.path.join(SRC_DIR, "advanced 2.mp3"),
]

# ── 기존 adv_*.mp3 초기화 ──────────────────────────────────────────
old_files = [f for f in os.listdir(OUT_DIR) if f.startswith("adv_") and f.endswith(".mp3")]
if old_files:
    print(f"[CLEAN] 기존 파일 {len(old_files)}개 삭제 중...")
    for f in old_files:
        os.remove(os.path.join(OUT_DIR, f))


def get_duration(path):
    out = subprocess.run(
        [FFMPEG, "-i", path, "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace"
    ).stderr
    m = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", out)
    if not m:
        return None
    h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
    return h * 3600 + mn * 60 + s


def detect_silences(path, min_dur):
    """지정 길이 이상의 무음 구간 (start, end) 리스트를 반환"""
    out = subprocess.run(
        [FFMPEG, "-i", path,
         "-af", f"silencedetect=noise={SILENCE_DB}:d={min_dur}",
         "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace"
    ).stderr
    starts = [float(x) for x in re.findall(r"silence_start:\s*([\d.]+)", out)]
    ends   = [float(x) for x in re.findall(r"silence_end:\s*([\d.]+)",   out)]
    return list(zip(starts[:len(ends)], ends[:len(starts)]))


def extract_trim_pad(src, seg_start, seg_end, out_path):
    """
    1) -ss/-t 로 세그먼트 추출
    2) silenceremove 로 앞부분 무음 Trim
    3) adelay 500ms 로 0.5초 여백 삽입
    (중급 fix_int41_split.py 와 동일한 파이프라인)
    """
    dur = seg_end - seg_start
    af = (
        f"silenceremove=start_periods=1:start_duration=0.001"
        f":start_threshold={SILENCE_DB},"
        f"adelay={DELAY_MS}:all=1"
    )
    cmd = [
        FFMPEG, "-y",
        "-ss", f"{seg_start:.4f}",
        "-t",  f"{dur:.4f}",
        "-i",  src,
        "-af", af,
        "-acodec", "libmp3lame", "-ab", "128k",
        out_path,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    if r.returncode != 0:
        print(f"    [WARN] ffmpeg 오류: {r.stderr[-300:]}")
        return False
    return os.path.exists(out_path) and os.path.getsize(out_path) > 2000


# ── 메인 처리 루프 ────────────────────────────────────────────────

global_counter = 1   # adv_01 부터 시작, 두 파일에 걸쳐 연속

for src_path in SOURCE_FILES:
    fname = os.path.basename(src_path)
    print(f"\n{'='*62}")
    print(f"  처리: {fname}")
    print(f"{'='*62}")

    if not os.path.exists(src_path):
        print(f"  [ERROR] 파일 없음: {src_path}")
        continue

    total_dur = get_duration(src_path)
    print(f"  전체 길이: {total_dur:.2f}s")

    # ── 무음 감지 ─────────────────────────────────────────────────
    silences = detect_silences(src_path, MIN_SILENCE_SEC)
    print(f"  감지된 무음 구간 (>= {MIN_SILENCE_SEC}s): {len(silences)}개")
    for idx, (s, e) in enumerate(silences, 1):
        print(f"    [{idx:3d}] {s:8.3f}s ~ {e:8.3f}s  (gap={e-s:.3f}s)")

    # ── 분할 경계 계산 ────────────────────────────────────────────
    midpoints  = [(s + e) / 2 for s, e in silences]
    boundaries = [0.0] + midpoints + [total_dur]
    all_segs   = [(boundaries[i], boundaries[i + 1])
                  for i in range(len(boundaries) - 1)]

    # 너무 짧은 세그먼트 제외
    valid_segs  = [(s, e) for s, e in all_segs if e - s >= MIN_SEG_SEC]
    skipped_cnt = len(all_segs) - len(valid_segs)
    if skipped_cnt:
        print(f"  ({skipped_cnt}개 짧은 세그먼트 제외 < {MIN_SEG_SEC}s)")

    print(f"\n  분할 및 저장 ({len(valid_segs)}문장):")

    file_ok = 0
    for seg_start, seg_end in valid_segs:
        out_name = f"adv_{global_counter:02d}.mp3"
        out_path = os.path.join(OUT_DIR, out_name)
        ok       = extract_trim_pad(src_path, seg_start, seg_end, out_path)
        size_kb  = os.path.getsize(out_path) // 1024 if os.path.exists(out_path) else 0
        raw_dur  = seg_end - seg_start
        status   = "OK " if ok else "FAIL"
        print(f"    [{global_counter:02d}] {out_name}  raw={raw_dur:.1f}s  {size_kb}KB  {status}")
        if ok:
            global_counter += 1
            file_ok += 1
        else:
            print(f"        -> 저장 실패, 번호 {global_counter} 유지")

    print(f"  => {fname}: {file_ok}개 저장")


# ── 최종 검증 ─────────────────────────────────────────────────────
print(f"\n{'='*62}")
print("  최종 검증")
print(f"{'='*62}")

saved = sorted(
    [f for f in os.listdir(OUT_DIR)
     if f.startswith("adv_") and f.endswith(".mp3")]
)
valid = [f for f in saved
         if os.path.getsize(os.path.join(OUT_DIR, f)) > 2000]

print(f"\n  생성 파일 수: {len(valid)}개")
print(f"  저장 위치:    {OUT_DIR}\n")
for f in valid:
    size_kb = os.path.getsize(os.path.join(OUT_DIR, f)) // 1024
    print(f"    {f}  {size_kb}KB")

total_valid = len(valid)
if total_valid > 0:
    print(f"\n  adv_01.mp3 ~ adv_{total_valid:02d}.mp3  (총 {total_valid}개, 모두 0.5초 여백 적용)")
else:
    print("\n  [ERROR] 생성된 파일이 없습니다. 파라미터를 확인하세요.")
