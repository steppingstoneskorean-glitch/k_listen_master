"""
Split Intermediate 41~58 MP3 into 18 individual sentence audio files.
Strategy:
  1. Detect silences, pick TOP 17 longest as sentence boundaries → 18 segments.
  2. For each segment: trim leading silence, then prepend exactly 0.5s of silence.
Output: public/audio/Intermediate/int_41.mp3 ~ int_58.mp3
"""

import os
import re
import subprocess
import tempfile
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

INPUT_FILE  = r"C:\k_listen_master\assets\audio\Intermediate 41~58 (com).mp3"
OUTPUT_DIR  = r"C:\k_listen_master\public\audio\Intermediate"
START_NUM   = 41
END_NUM     = 58
EXPECTED    = END_NUM - START_NUM + 1  # 18
N_GAPS      = EXPECTED - 1             # 17

SILENCE_DB   = "-40dB"
DETECT_DUR   = 0.3
PAD_SEC      = 0.5  # silence to prepend to each segment

os.makedirs(OUTPUT_DIR, exist_ok=True)


def detect_all_silences(filepath):
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


def extract_trim_pad(filepath, start_sec, end_sec, out_path):
    """
    Extract [start_sec, end_sec] from filepath,
    trim leading silence, then prepend PAD_SEC of silence.
    """
    duration = end_sec - start_sec

    # silenceremove: strip leading silence
    # adelay: add PAD_SEC * 1000 ms of silence at the front (stereo-safe with all_channels_at_once)
    delay_ms = int(PAD_SEC * 1000)
    af = (
        f"silenceremove=start_periods=1:start_duration=0.001:start_threshold={SILENCE_DB},"
        f"adelay={delay_ms}:all=1"
    )

    cmd = [
        FFMPEG, "-y",
        "-ss", f"{start_sec:.3f}",
        "-t",  f"{duration:.3f}",
        "-i",  filepath,
        "-af", af,
        "-acodec", "libmp3lame", "-ab", "128k",
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True,
                            encoding="utf-8", errors="replace")
    if result.returncode != 0:
        print(f"    [WARN] ffmpeg error:\n{result.stderr[-600:]}")
    return result.returncode == 0


# ── Main ────────────────────────────────────────────────────────────────────

print("=" * 60)
print(f"Input : {os.path.basename(INPUT_FILE)}")
print(f"Output: {OUTPUT_DIR}")
print(f"Range : int_{START_NUM}.mp3 ~ int_{END_NUM}.mp3  ({EXPECTED} files)")
print("=" * 60)

total_dur = get_duration(INPUT_FILE)
print(f"Total duration: {total_dur:.1f}s")

silences = detect_all_silences(INPUT_FILE)
print(f"Silences detected: {len(silences)}")
for s, e in silences:
    print(f"  {s:.3f}s ~ {e:.3f}s  ({e-s:.3f}s)")

# Pick the N_GAPS longest silences as sentence boundaries
ranked = sorted(silences, key=lambda x: -(x[1] - x[0]))
top    = sorted(ranked[:N_GAPS], key=lambda x: x[0])

print(f"\nTop {N_GAPS} silences used as boundaries:")
for s, e in top:
    print(f"  {s:.3f}s ~ {e:.3f}s  ({e-s:.3f}s)")

boundaries = [0.0] + [(s + e) / 2 for s, e in top] + [total_dur]
segments   = [(boundaries[i], boundaries[i + 1]) for i in range(len(boundaries) - 1)]

print(f"\nExtracting {len(segments)} segments...")
success_count = 0
for i, (seg_s, seg_e) in enumerate(segments):
    sentence_num = START_NUM + i
    filename     = f"int_{sentence_num}.mp3"
    out_path     = os.path.join(OUTPUT_DIR, filename)
    ok = extract_trim_pad(INPUT_FILE, seg_s, seg_e, out_path)
    seg_dur = seg_e - seg_s
    status = "OK" if ok else "FAIL"
    print(f"  [{status}] {filename}  raw={seg_dur:.2f}s  [{seg_s:.2f}~{seg_e:.2f}]")
    if ok:
        success_count += 1

print(f"\n{'='*60}")
if success_count == EXPECTED:
    print(f"SUCCESS: {success_count}/{EXPECTED} files saved to:")
    print(f"  {OUTPUT_DIR}")
else:
    print(f"PARTIAL: {success_count}/{EXPECTED} files saved. Review warnings above.")
