"""
reprocess_all.py
================
원본 통파일들에서 전체 오디오를 새로 분할/트림/패드 처리.

[Trim 로직 개선 사항]
  Before: silenceremove 필터를 -40dB 기준으로 직접 파이프 → 'ㅅ' 등 마찰음 첫소리 잘림
  After:  2-pass 방식
    Pass 1: 세그먼트를 임시 파일로 추출
    Pass 2: -50dB(완화된 기준)로 speech onset 감지
            감지 지점에서 80ms 앞을 trim 시작점으로 설정 (Buffer)
    Pass 3: trim 시작점부터 추출 + 0.5초 무음 삽입

출력 위치:
  Intermediate → C:\\k_listen_master\\public\\audio\\Intermediate\\int_XX.mp3
  Advanced     → C:\\k_listen_master\\public\\audio\\Advanced\\adv_XX.mp3
"""

import os
import re
import subprocess
import tempfile
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

INT_DIR = r"C:\k_listen_master\public\audio\Intermediate"
ADV_DIR = r"C:\k_listen_master\public\audio\Advanced"
SRC_DIR = r"C:\k_listen_master\assets\audio"

os.makedirs(INT_DIR, exist_ok=True)
os.makedirs(ADV_DIR, exist_ok=True)

# ── 파라미터 ─────────────────────────────────────────────────────────────────
SPLIT_DB   = "-40dB"  # 문장 경계 감지용 무음 임계값 (기존과 동일)
TRIM_DB    = "-50dB"  # speech onset 감지용 (기존 -40dB → -50dB 완화, 마찰음 보호)
BUFFER_SEC = 0.08     # speech onset 감지 후 앞으로 되돌아갈 버퍼 (80ms)
DELAY_MS   = 500      # 앞부분 삽입할 무음 길이 (0.5초, 기존과 동일)


# ── Helpers ──────────────────────────────────────────────────────────────────

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


def detect_silences(path, min_dur, noise_db=None):
    """min_dur 이상의 무음 구간 (start, end) 리스트 반환."""
    db = noise_db or SPLIT_DB
    out = subprocess.run(
        [FFMPEG, "-i", path,
         "-af", f"silencedetect=noise={db}:d={min_dur}",
         "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace"
    ).stderr
    starts = [float(x) for x in re.findall(r"silence_start:\s*([\d.]+)", out)]
    ends   = [float(x) for x in re.findall(r"silence_end:\s*([\d.]+)",   out)]
    return list(zip(starts[:len(ends)], ends[:len(starts)]))


def detect_speech_start(path):
    """
    앞부분 무음이 끝나는 지점(= speech onset)을 반환.
    TRIM_DB(-50dB) 기준 사용: 마찰음처럼 부드러운 첫소리를 무음으로 오판하지 않음.
    앞부분에 무음이 없으면 0.0 반환.
    """
    out = subprocess.run(
        [FFMPEG, "-i", path,
         "-af", f"silencedetect=noise={TRIM_DB}:d=0.05",
         "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace"
    ).stderr
    ends = [float(x) for x in re.findall(r"silence_end:\s*([\d.]+)", out)]
    return ends[0] if ends else 0.0


def extract_trim_pad(src, seg_start, seg_end, out_path):
    """
    원본 통파일의 [seg_start, seg_end] 구간을 추출하고,
    개선된 2-pass trim + 0.5초 패드를 적용해 out_path에 저장.

    Pass 1: 임시 파일로 raw 세그먼트 추출
    Pass 2: speech onset 감지 (TRIM_DB -50dB) → 80ms 버퍼 앞부터 trim
    Pass 3: trim 적용 + adelay 0.5초 → 최종 파일 저장
    """
    raw_dur = seg_end - seg_start

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tf:
        tmp_raw = tf.name

    try:
        # ── Pass 1: raw 세그먼트 추출 ──────────────────────────────
        cmd1 = [
            FFMPEG, "-y",
            "-ss", f"{seg_start:.4f}",
            "-t",  f"{raw_dur:.4f}",
            "-i",  src,
            "-acodec", "libmp3lame", "-ab", "128k",
            tmp_raw,
        ]
        r1 = subprocess.run(cmd1, capture_output=True,
                            encoding="utf-8", errors="replace")
        if r1.returncode != 0:
            print(f"    [WARN] Pass1 failed")
            return False

        # ── Pass 2: speech onset 감지, 80ms 버퍼 적용 ─────────────
        speech_start = detect_speech_start(tmp_raw)
        trim_from    = max(0.0, speech_start - BUFFER_SEC)
        actual_dur   = get_duration(tmp_raw) or raw_dur
        trim_dur     = actual_dur - trim_from

        # ── Pass 3: trim + 0.5초 패드 ──────────────────────────────
        cmd2 = [
            FFMPEG, "-y",
            "-ss", f"{trim_from:.4f}",
            "-t",  f"{trim_dur:.4f}",
            "-i",  tmp_raw,
            "-af", f"adelay={DELAY_MS}:all=1",
            "-acodec", "libmp3lame", "-ab", "128k",
            out_path,
        ]
        r2 = subprocess.run(cmd2, capture_output=True, text=True,
                            encoding="utf-8", errors="replace")
        ok = (r2.returncode == 0
              and os.path.exists(out_path)
              and os.path.getsize(out_path) > 2000)
        if not ok:
            print(f"    [WARN] Pass3: {r2.stderr[-200:]}")
        return ok

    except Exception as exc:
        print(f"    [ERR] {exc}")
        return False
    finally:
        try:
            os.remove(tmp_raw)
        except OSError:
            pass


# ── 분할 전략 A: 정확히 N개 (top N-1 longest silences) ───────────────────────

def split_fixed_count(src, start_num, end_num, out_dir, prefix, detect_dur=0.3):
    """
    원본 파일을 정확히 (end_num - start_num + 1)개로 분할.
    가장 긴 무음 N-1개를 문장 경계로 선택.
    """
    expected = end_num - start_num + 1
    n_gaps   = expected - 1

    print(f"\n{'='*62}")
    print(f"  {os.path.basename(src)}")
    print(f"  → {prefix}_{start_num:02d} ~ {prefix}_{end_num:02d}  ({expected}문장)")

    total = get_duration(src)
    if total is None:
        print(f"  [ERR] 길이를 읽을 수 없음: {src}")
        return 0, expected
    print(f"  Duration: {total:.1f}s")

    silences = detect_silences(src, detect_dur)
    print(f"  무음 구간 감지 (>= {detect_dur}s): {len(silences)}개")

    ranked = sorted(silences, key=lambda x: -(x[1] - x[0]))
    top    = sorted(ranked[:n_gaps], key=lambda x: x[0])

    print(f"  경계로 사용할 상위 {len(top)}개:")
    for s, e in top:
        print(f"    {s:.3f}s ~ {e:.3f}s  (gap={e-s:.3f}s)")

    boundaries = [0.0] + [(s + e) / 2 for s, e in top] + [total]
    segments   = [(boundaries[i], boundaries[i + 1])
                  for i in range(len(boundaries) - 1)]

    print(f"\n  분할 저장:")
    ok_count = 0
    for i, (seg_s, seg_e) in enumerate(segments):
        num      = start_num + i
        name     = f"{prefix}_{num:02d}.mp3"
        out_path = os.path.join(out_dir, name)
        ok       = extract_trim_pad(src, seg_s, seg_e, out_path)
        raw_dur  = seg_e - seg_s
        print(f"    [{'OK  ' if ok else 'FAIL'}] {name}  raw={raw_dur:.2f}s")
        if ok:
            ok_count += 1

    return ok_count, expected


# ── 분할 전략 B: 무음 기준 자동 분할 (Advanced용) ────────────────────────────

def split_by_silence(src, out_dir, prefix, global_counter,
                     min_silence=0.7, min_seg=1.2):
    """
    파일 내 모든 무음(>= min_silence)을 경계로 분할.
    너무 짧은 세그먼트(< min_seg)는 제외.
    global_counter를 이어받아 순차 번호 부여.
    Returns (new_global_counter, files_written).
    """
    total = get_duration(src)
    if total is None:
        print(f"  [ERR] 읽기 실패: {src}")
        return global_counter, 0

    print(f"\n{'='*62}")
    print(f"  {os.path.basename(src)}  ({total:.1f}s)")

    silences = detect_silences(src, min_silence)
    print(f"  무음 구간 (>= {min_silence}s): {len(silences)}개")
    for idx, (s, e) in enumerate(silences, 1):
        print(f"    [{idx:3d}] {s:8.3f}s ~ {e:8.3f}s  (gap={e-s:.3f}s)")

    midpoints  = [(s + e) / 2 for s, e in silences]
    boundaries = [0.0] + midpoints + [total]
    all_segs   = [(boundaries[i], boundaries[i + 1])
                  for i in range(len(boundaries) - 1)]
    valid_segs = [(s, e) for s, e in all_segs if e - s >= min_seg]

    skipped = len(all_segs) - len(valid_segs)
    if skipped:
        print(f"  (짧은 세그먼트 {skipped}개 제외 < {min_seg}s)")
    print(f"\n  분할 저장 ({len(valid_segs)}개):")

    ok_count = 0
    for seg_s, seg_e in valid_segs:
        name     = f"{prefix}_{global_counter:02d}.mp3"
        out_path = os.path.join(out_dir, name)
        ok       = extract_trim_pad(src, seg_s, seg_e, out_path)
        raw_dur  = seg_e - seg_s
        print(f"    [{'OK  ' if ok else 'FAIL'}] {name}  raw={raw_dur:.1f}s")
        if ok:
            global_counter += 1
            ok_count += 1

    return global_counter, ok_count


# ════════════════════════════════════════════════════════════════════════════
# INTERMEDIATE  int_01 ~ int_132
# ════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("  INTERMEDIATE  (int_01 ~ int_132)")
print("=" * 62)

# 기존 파일 전부 삭제 후 재생성
old_int = [f for f in os.listdir(INT_DIR)
           if f.startswith("int_") and f.endswith(".mp3")]
if old_int:
    print(f"[CLEAN] 기존 int_*.mp3 {len(old_int)}개 삭제...")
    for f in old_int:
        os.remove(os.path.join(INT_DIR, f))

INT_JOBS = [
    (os.path.join(SRC_DIR, "Intermediate 1~20 (com).mp3"),    1,  20),
    (os.path.join(SRC_DIR, "Intermediate 21~40 (com).mp3"),  21,  40),
    (os.path.join(SRC_DIR, "Intermediate 41~58 (com).mp3"),  41,  58),
    (os.path.join(SRC_DIR, "Intermediate 59~65 (com).mp3"),  59,  65),
    (os.path.join(SRC_DIR, "Intermediate 66~80 (com).mp3"),  66,  80),
    (os.path.join(SRC_DIR, "Intermediate 81~132 (com).mp3"), 81, 132),
]

int_ok = int_total = 0
for src_path, s, e in INT_JOBS:
    if not os.path.exists(src_path):
        print(f"\n[ERR] 소스 없음: {src_path}")
        int_total += (e - s + 1)
        continue
    ok, total = split_fixed_count(src_path, s, e, INT_DIR, "int")
    int_ok    += ok
    int_total += total

print(f"\nIntermediate 결과: {int_ok}/{int_total}")


# ════════════════════════════════════════════════════════════════════════════
# ADVANCED  adv_01 ~ adv_N
# ════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("  ADVANCED  (adv_01 ~ adv_N)")
print("=" * 62)

old_adv = [f for f in os.listdir(ADV_DIR)
           if f.startswith("adv_") and f.endswith(".mp3")]
if old_adv:
    print(f"[CLEAN] 기존 adv_*.mp3 {len(old_adv)}개 삭제...")
    for f in old_adv:
        os.remove(os.path.join(ADV_DIR, f))

ADV_SOURCES = [
    os.path.join(SRC_DIR, "advanced 1.mp3"),
    os.path.join(SRC_DIR, "advanced 2.mp3"),
]

adv_counter = 1
adv_ok_total = 0
for src_path in ADV_SOURCES:
    if not os.path.exists(src_path):
        print(f"\n[ERR] 소스 없음: {src_path}")
        continue
    adv_counter, ok = split_by_silence(
        src_path, ADV_DIR, "adv", adv_counter,
        min_silence=0.7, min_seg=1.2
    )
    adv_ok_total += ok

print(f"\nAdvanced 결과: {adv_ok_total}개 저장 (adv_01 ~ adv_{adv_counter-1:02d})")


# ════════════════════════════════════════════════════════════════════════════
# 최종 검증
# ════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 62)
print("  최종 검증")
print("=" * 62)

present_int = []
missing_int = []
for n in range(1, 133):
    fname = f"int_{n:02d}.mp3"
    p     = os.path.join(INT_DIR, fname)
    if os.path.exists(p) and os.path.getsize(p) > 2000:
        present_int.append(fname)
    else:
        missing_int.append(fname)

print(f"\nIntermediate: {len(present_int)}/132 존재")
if missing_int:
    print(f"  누락: {missing_int}")
else:
    print("  전체 132개 확인 완료 - int_01.mp3 ~ int_132.mp3")

adv_files = sorted(
    f for f in os.listdir(ADV_DIR)
    if f.startswith("adv_") and f.endswith(".mp3")
    and os.path.getsize(os.path.join(ADV_DIR, f)) > 2000
)
print(f"\nAdvanced: {len(adv_files)}개")
for f in adv_files:
    kb = os.path.getsize(os.path.join(ADV_DIR, f)) // 1024
    print(f"  {f}  {kb}KB")

print("\n" + "=" * 62)
print("  DONE")
print("=" * 62)
