"""
fix_int41_split.py
==================
1. int_41.mp3 을 두 문장으로 분할 → new int_41, new int_42
2. int_42 ~ int_58  →  int_43 ~ int_59   (역순 이름 변경, 빈 int_59 덮어쓰기)
3. int_60 ~ int_132 → 변경 없음 (이미 올바른 번호)
"""

import os, re, subprocess, tempfile, imageio_ffmpeg

FFMPEG    = imageio_ffmpeg.get_ffmpeg_exe()
AUDIO_DIR = r"C:\k_listen_master\public\audio\Intermediate"
SILENCE_DB = "-40dB"
DELAY_MS   = 500   # 0.5s lead-in pad

def get_duration(path):
    out = subprocess.run([FFMPEG, "-i", path, "-f", "null", "-"],
                         capture_output=True, text=True,
                         encoding="utf-8", errors="replace").stderr
    m = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", out)
    if m:
        h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        return h * 3600 + mn * 60 + s
    return None

def detect_silences(path):
    out = subprocess.run(
        [FFMPEG, "-i", path,
         "-af", f"silencedetect=noise={SILENCE_DB}:d=0.2",
         "-f", "null", "-"],
        capture_output=True, text=True,
        encoding="utf-8", errors="replace").stderr
    starts = [float(m) for m in re.findall(r"silence_start:\s*([\d.]+)", out)]
    ends   = [float(m) for m in re.findall(r"silence_end:\s*([\d.]+)",   out)]
    return list(zip(starts[:len(ends)], ends[:len(starts)]))

def extract_trim_pad(src, start_sec, end_sec, out_path):
    """Extract segment, trim leading silence, prepend 0.5 s."""
    dur = end_sec - start_sec
    af  = (
        f"silenceremove=start_periods=1:start_duration=0.001"
        f":start_threshold={SILENCE_DB},"
        f"adelay={DELAY_MS}:all=1"
    )
    cmd = [
        FFMPEG, "-y",
        "-ss", f"{start_sec:.4f}", "-t", f"{dur:.4f}",
        "-i", src,
        "-af", af,
        "-acodec", "libmp3lame", "-ab", "128k",
        out_path,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    ok = r.returncode == 0 and os.path.getsize(out_path) > 2000
    if not ok:
        print(f"  [WARN] {r.stderr[-400:]}")
    return ok


# ═══════════════════════════════════════════════════════════════════
# STEP 1 — int_41.mp3 분할
# ═══════════════════════════════════════════════════════════════════
print("=" * 60)
print("STEP 1  int_41.mp3 → int_41 (문장41) + int_42 (문장42)")
print("=" * 60)

src41   = os.path.join(AUDIO_DIR, "int_41.mp3")
total   = get_duration(src41)
silences = detect_silences(src41)
print(f"  Duration: {total:.2f}s")
print(f"  Silences ({len(silences)}):")
for s, e in silences:
    print(f"    {s:.3f}s ~ {e:.3f}s  gap={e-s:.3f}s")

# 가장 긴 갭을 경계로 선택
best = max(silences, key=lambda x: x[1] - x[0])
split_at = (best[0] + best[1]) / 2
print(f"\n  Split point: {split_at:.4f}s  (gap {best[0]:.3f}~{best[1]:.3f})")

# 임시 파일로 추출
tmp41 = os.path.join(AUDIO_DIR, "_tmp_int_41.mp3")
tmp42 = os.path.join(AUDIO_DIR, "_tmp_int_42.mp3")

ok41 = extract_trim_pad(src41, 0,        split_at, tmp41)
ok42 = extract_trim_pad(src41, split_at, total,    tmp42)

print(f"  문장41 추출: {'OK' if ok41 else 'FAIL'}  → {os.path.getsize(tmp41):,} bytes")
print(f"  문장42 추출: {'OK' if ok42 else 'FAIL'}  → {os.path.getsize(tmp42):,} bytes")

if not (ok41 and ok42):
    print("\n[ABORT] 분할에 실패했습니다. 원본 파일을 확인하세요.")
    raise SystemExit(1)


# ═══════════════════════════════════════════════════════════════════
# STEP 2 — int_42 ~ int_58  →  int_43 ~ int_59  (역순 이름 변경)
# ═══════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 2  int_42~int_58  →  int_43~int_59  (역순 이동)")
print("=" * 60)

# 역순(높은 번호부터)으로 처리해야 덮어쓰기 충돌이 없음
for n in range(58, 41, -1):   # 58, 57, ..., 42
    old = os.path.join(AUDIO_DIR, f"int_{n:02d}.mp3")
    new = os.path.join(AUDIO_DIR, f"int_{n+1:02d}.mp3")
    if os.path.exists(old):
        os.replace(old, new)
        dur = get_duration(new) or 0
        print(f"  int_{n:02d}.mp3  →  int_{n+1:02d}.mp3  ({dur:.2f}s)")
    else:
        print(f"  [SKIP] int_{n:02d}.mp3 not found")


# ═══════════════════════════════════════════════════════════════════
# STEP 3 — 임시 파일을 최종 위치로 이동
# ═══════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 3  임시 파일 최종 배치")
print("=" * 60)

dst41 = os.path.join(AUDIO_DIR, "int_41.mp3")
dst42 = os.path.join(AUDIO_DIR, "int_42.mp3")

os.replace(tmp41, dst41)
os.replace(tmp42, dst42)
print(f"  _tmp_int_41.mp3  →  int_41.mp3  ({get_duration(dst41):.2f}s)")
print(f"  _tmp_int_42.mp3  →  int_42.mp3  ({get_duration(dst42):.2f}s)")


# ═══════════════════════════════════════════════════════════════════
# FINAL CHECK
# ═══════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("FINAL CHECK  int_41 ~ int_65 확인")
print("=" * 60)

for n in range(41, 66):
    f = os.path.join(AUDIO_DIR, f"int_{n:02d}.mp3")
    if os.path.exists(f):
        d = get_duration(f) or 0
        status = "OK " if d > 1.0 else "WARN (very short)"
        print(f"  int_{n:02d}.mp3  {d:.2f}s  {status}")
    else:
        print(f"  int_{n:02d}.mp3  MISSING")

present = sum(1 for n in range(1, 133)
              if os.path.exists(os.path.join(AUDIO_DIR, f"int_{n:02d}.mp3"))
              and os.path.getsize(os.path.join(AUDIO_DIR, f"int_{n:02d}.mp3")) > 2000)
print(f"\n  Total valid files (>2KB): {present} / 132")
