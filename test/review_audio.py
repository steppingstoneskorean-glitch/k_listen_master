import os
import sounddevice as sd
from scipy.io import wavfile

base_split_folder = "./split_results"
final_folder = "./final_audio"

# 최종 저장 폴더가 없으면 생성
if not os.path.exists(final_folder):
    os.makedirs(final_folder)

print("🎵 Step Korean 오디오 검수 프로그램을 시작합니다!")
print("-" * 50)

# 1. 분할된 레벨 폴더 목록 가져오기
if not os.path.exists(base_split_folder):
    print(f"❌ '{base_split_folder}' 폴더가 없습니다. 2단계 분할을 먼저 완료해 주세요.")
    exit()

levels = [d for d in os.listdir(base_split_folder) if os.path.isdir(os.path.join(base_split_folder, d))]

if not levels:
    print("⚠️ split_results 폴더 안에 레벨 폴더가 비어 있습니다.")
    exit()

print("[ 검수 가능한 레벨 목록 ]")
for idx, lvl in enumerate(levels, 1):
    print(f" [{idx}] {lvl}")

# 2. 유저에게 레벨 선택 받기
try:
    choice = int(input("\n👉 검수할 레벨의 번호를 입력하세요 (예: 1): ")) - 1
    selected_level = levels[choice]
except (ValueError, IndexError):
    print("❌ 올바른 번호가 아닙니다. 프로그램을 종료합니다.")
    exit()

split_folder = os.path.join(base_split_folder, selected_level)
wav_files = [f for f in os.listdir(split_folder) if f.endswith('.wav')]

if not wav_files:
    print(f"⚠️ {selected_level} 폴더 안에 검수할 파일이 없습니다.")
    exit()

# 파일명 숫자 순서대로 정렬 (예: Level1_word_1, Level1_word_2 순서 보장)
try:
    wav_files.sort(key=lambda x: int(x.split('_')[-1].split('.')[0]))
except Exception:
    wav_files.sort()

print(f"\n🚀 {selected_level} 검수를 시작합니다! (총 {len(wav_files)}개 조각)")
print("-" * 50)
print("[ 조작 단축키 안내 ]")
print(" - 단어 이름 입력 : 해당 이름으로 'final_audio' 폴더에 저장 (예: 불, 뿔)")
print(" - x 입력         : 잘못 녹음된 파일 즉시 삭제 (⚠️디스크에서 영구 제거)")
print(" - r 입력         : 방금 들은 소리 다시 재생")
print(" - q 입력         : 검수 종료 및 프로그램 나가기")
print("-" * 50)

# 3. 오디오 재생 및 검수 루프
for filename in wav_files:
    file_path = os.path.join(split_folder, filename)
    
    if not os.path.exists(file_path):
        continue
        
    fs, data = wavfile.read(file_path)
    
    while True:
        print(f"\n▶️ 재생 중: {filename}")
        sd.play(data, fs)
        sd.wait()  # 재생 완료까지 대기
        
        user_input = input("단어 이름 입력 (x=삭제 / r=다시듣기 / q=종료): ").strip()
        
        if user_input.lower() == 'r':
            continue
            
        elif user_input.lower() == 'x':
            os.remove(file_path)
            print(f"🗑️ [삭제 완료] 실수한 녹음 파일({filename})을 삭제했습니다.")
            break
            
        elif user_input.lower() == 'q':
            print("🛑 검수를 중단합니다. 수고하셨습니다!")
            exit()
            
        elif user_input != "":
            # 파일명 지정 및 저장 경로 설정
            new_filename = f"{user_input}.wav"
            new_path = os.path.join(final_folder, new_filename)
            
            # 이름 중복 방지 (동일 단어 여러 개 성공 시 번호 매김)
            counter = 1
            base_name = user_input
            while os.path.exists(new_path):
                new_filename = f"{base_name}_{counter}.wav"
                new_path = os.path.join(final_folder, new_filename)
                counter += 1
            
            os.rename(file_path, new_path)
            print(f"✅ [저장 완료] -> 'final_audio/{new_filename}'")
            break
            
        else:
            print("⚠️ 단어 이름을 입력하거나 명령어(x, r, q)를 입력해 주세요.")

print(f"\n🎉 {selected_level}의 모든 오디오 파일 검수가 완료되었습니다!")