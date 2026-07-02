"""
process_audio_all.py
====================
Task 1: int_01 ~ int_40  — trim leading silence + prepend 0.5 s silence (overwrite)
Task 2: int_59 ~ int_132 — split from concatenated files, trim + pad, save
int_41 ~ int_58 are already correctly processed; skipped.
"""

import os
import re
import subprocess
import tempfile
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

OUTPUT_DIR = r"C:\k_listen_master\public\audio\Intermediate"
ASSETS_DIR = r"C:\k_listen_master\assets\audio"

SILENCE_DB = "-40dB"
DETECT_DUR  = 0.3    # minimum gap length to consider as a boundary candidate
PAD_SEC     = 0.5    # silence to prepend
DELAY_MS    = int(PAD_SEC * 1000)  # 500

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_duration(filepath):
    cmd = [FFMPEG, "-i", filepath, "-f", "null", "-"]
    out = subprocess.run(cmd, capture_output=True, text=True,
                         encoding="utf-8", errors="replace").stderr
    m = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", out)
    if m:
        h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        return h * 3600 + mn * 60 + s
    return None


def detect_silences(filepath):
    """Return list of (start_sec, end_sec) for every silence >= DETECT_DUR."""
    cmd = [
        FFMPEG, "-i", filepath,
        "-af", f"silencedetect=noise={SILENCE_DB}:d={DETECT_DUR}",
        "-f", "null", "-",
    ]
    out = subprocess.run(cmd, capture_output=True, text=True,
                         encoding="utf-8", errors="replace").stderr
    starts = [float(m) for m in re.findall(r"silence_start:\s*([\d.]+)", out)]
    ends   = [float(m) for m in re.findall(r"silence_end:\s*([\d.]+)",   out)]
    return list(zip(starts[:len(ends)], ends[:len(starts)]))


def trim_and_pad_inplace(filepath):
    """
    Trim leading silence from filepath, prepend 0.5 s silence, overwrite.
    Uses a temp file so the original is not corrupted on failure.
    """
    af = (
        f"silenceremove=start_periods=1:start_duration=0.001:start_threshold={SILENCE_DB},"
        f"adelay={DELAY_MS}:all=1"
    )
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tf:
        tmp = tf.name
    try:
        cmd = [
            FFMPEG, "-y",
            "-i", filepath,
            "-af", af,
            "-acodec", "libmp3lame", "-ab", "128k",
            tmp,
        ]
        r = subprocess.run(cmd, capture_output=True, text=True,
                           encoding="utf-8", errors="replace")
        if r.returncode != 0:
            print(f"    [WARN] ffmpeg stderr:\n{r.stderr[-500:]}")
            return False
        if os.path.getsize(tmp) < 2000:
            print(f"    [WARN] output suspiciously small ({os.path.getsize(tmp)} bytes)")
            return False
        os.replace(tmp, filepath)
        return True
    except Exception as e:
        print(f"    [ERR] {e}")
        try:
            os.remove(tmp)
        except OSError:
            pass
        return False


def extract_trim_pad(src, start_sec, end_sec, out_path):
    """Extract [start, end] from src, trim leading silence, prepend 0.5 s, save."""
    duration = end_sec - start_sec
    af = (
        f"silenceremove=start_periods=1:start_duration=0.001:start_threshold={SILENCE_DB},"
        f"adelay={DELAY_MS}:all=1"
    )
    cmd = [
        FFMPEG, "-y",
        "-ss", f"{start_sec:.3f}",
        "-t",  f"{duration:.3f}",
        "-i",  src,
        "-af", af,
        "-acodec", "libmp3lame", "-ab", "128k",
        out_path,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    if r.returncode != 0:
        print(f"    [WARN] ffmpeg stderr:\n{r.stderr[-500:]}")
    return r.returncode == 0


def split_and_process(filepath, start_num, end_num):
    """Split filepath into (end_num - start_num + 1) segments, trim+pad each."""
    expected = end_num - start_num + 1
    n_gaps   = expected - 1

    basename = os.path.basename(filepath)
    print(f"\n{'='*60}")
    print(f"Splitting: {basename}")
    print(f"  → int_{start_num:02d}.mp3 ~ int_{end_num:02d}.mp3  ({expected} files)")

    total = get_duration(filepath)
    if total is None:
        print("  [ERR] Could not read duration. Skipping.")
        return 0, expected
    print(f"  Duration: {total:.1f}s")

    silences = detect_silences(filepath)
    print(f"  Silences detected: {len(silences)}")
    for s, e in silences:
        print(f"    {s:.3f}s ~ {e:.3f}s  (gap={e-s:.3f}s)")

    # Pick the N-1 longest gaps as sentence boundaries
    ranked = sorted(silences, key=lambda x: -(x[1] - x[0]))
    top    = sorted(ranked[:n_gaps], key=lambda x: x[0])

    print(f"\n  Selected {len(top)} boundary gaps:")
    for s, e in top:
        print(f"    {s:.3f}s ~ {e:.3f}s  (gap={e-s:.3f}s)")

    boundaries = [0.0] + [(s + e) / 2 for s, e in top] + [total]
    segments   = [(boundaries[i], boundaries[i + 1])
                  for i in range(len(boundaries) - 1)]

    print(f"\n  Extracting {len(segments)} segments...")
    ok_count = 0
    for i, (seg_s, seg_e) in enumerate(segments):
        num      = start_num + i
        fname    = f"int_{num:02d}.mp3"
        out_path = os.path.join(OUTPUT_DIR, fname)
        ok = extract_trim_pad(filepath, seg_s, seg_e, out_path)
        tag = "OK  " if ok else "FAIL"
        print(f"    [{tag}] {fname}  [{seg_s:.2f}s ~ {seg_e:.2f}s]  raw={seg_e-seg_s:.2f}s")
        if ok:
            ok_count += 1

    return ok_count, expected


# ════════════════════════════════════════════════════════════════
# TASK 1 — Trim + pad  int_01 ~ int_40
# ════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("TASK 1: Trim leading silence + add 0.5s pad  (int_01 ~ int_40)")
print("="*60)

t1_ok = 0
for n in range(1, 41):
    fname    = f"int_{n:02d}.mp3"
    fpath    = os.path.join(OUTPUT_DIR, fname)
    if not os.path.exists(fpath):
        print(f"  [SKIP] {fname} — file not found")
        continue
    ok = trim_and_pad_inplace(fpath)
    print(f"  {'[OK]  ' if ok else '[FAIL]'} {fname}")
    if ok:
        t1_ok += 1

print(f"\nTask 1 result: {t1_ok}/40 files updated.")


# ════════════════════════════════════════════════════════════════
# TASK 2 — Split + trim + pad  int_59 ~ int_132
# ════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("TASK 2: Split concatenated files  (int_59 ~ int_132)")
print("="*60)

SPLIT_JOBS = [
    (os.path.join(ASSETS_DIR, "Intermediate 59~65 (com).mp3"),   59,  65),
    (os.path.join(ASSETS_DIR, "Intermediate 66~80 (com).mp3"),   66,  80),
    (os.path.join(ASSETS_DIR, "Intermediate 81~132 (com).mp3"),  81, 132),
]

t2_ok = t2_total = 0
for fp, s, e in SPLIT_JOBS:
    if not os.path.exists(fp):
        print(f"\n[ERR] Source not found: {fp}")
        t2_total += (e - s + 1)
        continue
    ok, total = split_and_process(fp, s, e)
    t2_ok    += ok
    t2_total += total

print(f"\nTask 2 result: {t2_ok}/{t2_total} files saved.")


# ════════════════════════════════════════════════════════════════
# FINAL CHECK
# ════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("FINAL CHECK")
print("="*60)

present = []
missing = []
for n in range(1, 133):
    fname = f"int_{n:02d}.mp3"
    p     = os.path.join(OUTPUT_DIR, fname)
    if os.path.exists(p) and os.path.getsize(p) > 2000:
        present.append(fname)
    else:
        missing.append(fname)

print(f"Files present : {len(present)} / 132")
if missing:
    print(f"Missing ({len(missing)}): {missing}")
else:
    print("All 132 files confirmed — int_01.mp3 ~ int_132.mp3")

print("\n" + "="*60)
print("DONE")
print("="*60)
