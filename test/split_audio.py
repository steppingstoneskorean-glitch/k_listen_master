import os
from pydub import AudioSegment
from pydub.silence import split_on_silence

# 자동 번역기 경로 주입
import static_ffmpeg
static_ffmpeg.add_paths()

# 1. 경로 설정
input_folder = "./assets/audio"
output_base_folder = "./split_results"

print("🔍 오디오 파일을 탐색하는 중입니다...")

if not os.path.exists(input_folder):
    print(f"❌ '{input_folder}' 폴더가 존재하지 않습니다.")
    exit()

audio_files = [f for f in os.listdir(input_folder) if f.lower().endswith(('.ma4', '.m4a', '.wav'))]

if not audio_files:
    print(f"⚠️ '{input_folder}' 폴더 안에 녹음 파일이 보이지 않습니다.")
    exit()

print(f"총 {len(audio_files)}개의 녹음 파일을 찾았습니다: {audio_files}\n")

# 2. 파일별로 자동 분할 시작
for filename in audio_files:
    input_path = os.path.join(input_folder, filename)
    level_name = os.path.splitext(filename)[0]
    
    output_folder = os.path.join(output_base_folder, level_name)
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    print(f"🎧 [{filename}] 자르는 중... (여유로운 여백 설정 적용)")
    
    try:
        audio = AudioSegment.from_file(input_path)
        
        # 🔥 대표님의 요청을 반영한 널널하고 부드러운 분할 세팅
        chunks = split_on_silence(
            audio,
            min_silence_len=700,     # 1) 단어 사이 무음이 최소 0.7초 이상일 때만 자릅니다 (자연스러운 호흡 보장)
            silence_thresh=-50,      # 2) 기준을 -40에서 -50dB로 대폭 낮췄습니다. 아주 미세한 말끝 잔음도 소리로 인식하여 잘리지 않습니다.
            keep_silence=400         # 3) [핵심] 잘라낸 단어 앞뒤로 대표님이 요청하신 0.4초(400ms)의 여백을 무조건 보장합니다.
        )
        
        for i, chunk in enumerate(chunks):
            output_file = os.path.join(output_folder, f"{level_name}_word_{i+1}.wav")
            chunk.export(output_file, format="wav")
            
        print(f"✅ 완료! -> '{output_folder}' 폴더에 {len(chunks)}개 조각 저장됨.\n")
        
    except Exception as e:
        print(f"❌ {filename} 처리 실패: {e}")