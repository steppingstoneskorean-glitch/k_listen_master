import sys
import subprocess

print("🔄 Step Korean 오디오 환경 최종 패치를 시작합니다...")

try:
    # 윈도우용 ffmpeg 번역기를 파이썬 내부로 자동 다운로드해주는 라이브러리 설치
    print("📦 자동 오디오 번역기(static-ffmpeg) 설치 중...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "static-ffmpeg"])
    
    print("\n🎉 [성공] 번역기 패키지 설치가 완료되었습니다!")
    print("이제 이 파일은 끄시고, split_audio.py로 이동해 주세요.")
except Exception as e:
    print(f"\n❌ 설치 중 문제가 발생했습니다: {e}")