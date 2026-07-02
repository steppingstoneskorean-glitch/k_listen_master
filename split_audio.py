"""
Split Intermediate MP3 files into individual sentence audio files.
Strategy: detect all silences, pick TOP (N-1) longest as sentence boundaries → always N segments.
Output: public/audio/level2/int_01.mp3 ~ int_40.mp3
"""

import os
import re
import subprocess
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
OUTPUT_DIR = r"C:\k_listen_master\public\audio\level2"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SILENCE_DB      = "-40dB"  # noise floor
DETECT_DUR      = 0.3      # minimum duration for initial detection (catch everything)

FILES = [
    (r"C:\k_listen_master\assets\audio\Intermediate 1~20 (com).mp3",  1, 20),
    (r"C:\k_listen_master\assets\audio\Intermediate 21~40 (com).mp3", 21, 40),
]


def detect_all_silences(filepath):
    """Detect every silence >= DETECT_DUR seconds. Returns list of (start, end)."""
    cmd = [
        FFMPEG, "-i", filepath,
        "-af", f"silencedetect=noise={SILENCE_DB}:d={DETECT_DUR}",
        "-f", "null", "-",
    ]
    out = subprocess.run(cmd, capture_output=True, text=True,
                         encoding="utf-8", errors="replace").stderr
    starts = [float(m) for m in re.findall(r"silence_start:\s*([\d.]+)", out)]
    ends   = [float(m) for m in re.findall(r"silence_end:\s*([\d.]+)",   out)]
    pairs  = list(zip(starts[:len(ends)], ends[:len(starts)]))
    return pairs


def get_duration(filepath):
    cmd = [FFMPEG, "-i", filepath, "-f", "null", "-"]
    out = subprocess.run(cmd, capture_output=True, text=True,
                         encoding="utf-8", errors="replace").stderr
    m = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", out)
    if m:
        h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        return h * 3600 + mn * 60 + s
    return None


def extract_segment(filepath, start_sec, end_sec, out_path):
    duration = end_sec - start_sec
    cmd = [
        FFMPEG, "-y",
        "-ss", f"{start_sec:.3f}",
        "-t",  f"{duration:.3f}",
        "-i",  filepath,
        "-acodec", "libmp3lame", "-ab", "128k",
        out_path,
    ]
    subprocess.run(cmd, capture_output=True, check=True)


all_ok = True

for filepath, start_num, end_num in FILES:
    expected   = end_num - start_num + 1
    n_gaps     = expected - 1   # number of inter-sentence boundaries needed

    print(f"\n{'='*60}")
    print(f"Processing: {os.path.basename(filepath)}")
    print(f"Expected: {start_num}~{end_num} ({expected} sentences, {n_gaps} boundaries)")
    print(f"{'='*60}")

    total_dur = get_duration(filepath)
    print(f"Duration: {total_dur:.1f}s")

    silences = detect_all_silences(filepath)
    print(f"All silences detected: {len(silences)}")

    # Pick the N-1 LONGEST silences as sentence boundaries
    ranked = sorted(silences, key=lambda x: -(x[1] - x[0]))
    top    = sorted(ranked[:n_gaps], key=lambda x: x[0])  # back to chronological order

    print(f"Using top {n_gaps} silences as boundaries:")
    for s, e in top:
        print(f"  {s:.3f}s ~ {e:.3f}s  ({e-s:.3f}s)")

    # Build cut points from midpoints of selected silences
    boundaries = [0.0] + [(s + e) / 2 for s, e in top] + [total_dur]
    segments   = [(boundaries[i], boundaries[i + 1]) for i in range(len(boundaries) - 1)]

    print(f"\nSegments: {len(segments)}")
    for i, (seg_s, seg_e) in enumerate(segments):
        sentence_num = start_num + i
        filename     = f"int_{sentence_num:02d}.mp3"
        out_path     = os.path.join(OUTPUT_DIR, filename)
        extract_segment(filepath, seg_s, seg_e, out_path)
        dur = seg_e - seg_s
        print(f"  [{sentence_num:02d}] {filename}  ({dur:.2f}s)  [{seg_s:.2f}~{seg_e:.2f}]")

    if len(segments) == expected:
        print(f"  OK: {expected} segments saved.")
    else:
        print(f"  ERROR: expected {expected}, got {len(segments)}")
        all_ok = False

print(f"\n{'='*60}")
if all_ok:
    print("SUCCESS: All 40 files saved to:")
    print(f"  {OUTPUT_DIR}")
else:
    print("PARTIAL: Review output above.")
