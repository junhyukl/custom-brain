"""
Face Recognition + Voice Memory + Family Graph 자동 연결 메인.
- 카메라 프레임 → 얼굴 인식 → 인물 확인 → 음성 녹음 → STT → Voice Memory 저장 → Family Graph 관계 추론.
실행: 프로젝트 루트에서
  PYTHONPATH=. python -m ai_family_system.main
또는
  cd ai_family_system && python main.py
"""
import sys
from pathlib import Path

# 패키지 루트를 path에 추가 (cd ai_family_system && python main.py 시)
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT.parent))

def run_once_with_file(image_path: str, audio_path: str, speaker: str) -> None:
    """이미지에서 인물 인식 + 음성 파일 전사 후 process_voice (파일 기반 1회)."""
    from face.face_recognize import recognize_from_image_path
    from voice.speech_to_text import transcribe
    from voice.voice_memory import process_voice

    names = recognize_from_image_path(image_path)
    if not names:
        print("No faces detected or no match.")
        return
    person = names[0] if names else "Unknown"
    if person == "Unknown":
        person = speaker or "Unknown"
    print("Person:", person)
    text = transcribe(audio_path)
    if not text:
        print("No speech text.")
        return
    print("Speech:", text[:200] + "..." if len(text) > 200 else text)
    ok = process_voice(person, text, audio_path)
    print("Processed:", ok)


def run_camera_loop(duration_sec: float = 5) -> None:
    """카메라 루프: 프레임에서 얼굴 인식 → 인물 있으면 녹음 → STT → process_voice. (선택)"""
    try:
        import cv2
    except ImportError:
        print("opencv-python required for camera. pip install opencv-python")
        return
    from face.face_recognize import recognize_from_image_path
    from voice.voice_record import record_audio
    from voice.speech_to_text import transcribe
    from voice.voice_memory import process_voice

    cam = cv2.VideoCapture(0)
    if not cam.isOpened():
        print("Camera not available.")
        return
    print("Camera ready. Press 'c' to capture and record, 'q' to quit.")
    while True:
        ret, frame = cam.read()
        if not ret:
            break
        cv2.imshow("camera", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        if key == ord("c"):
            # 임시 저장 후 인식
            tmp_path = ROOT / "data" / "tmp_capture.jpg"
            tmp_path.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(tmp_path), frame)
            names = recognize_from_image_path(str(tmp_path))
            person = names[0] if names and names[0] != "Unknown" else "Unknown"
            print("Person:", person)
            if person != "Unknown":
                audio = record_audio(filename="capture.wav", duration_sec=duration_sec)
                if audio:
                    text = transcribe(audio)
                    if text:
                        process_voice(person, text, audio)
                        print("Voice saved and graph updated.")
            else:
                print("Unknown person, skip recording.")
    cam.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Face + Voice + Family Graph pipeline")
    p.add_argument("--camera", action="store_true", help="Run camera loop (c=capture+record, q=quit)")
    p.add_argument("--duration", type=float, default=5, help="Recording duration (seconds)")
    p.add_argument("--image", type=str, help="Image path (for file-based run)")
    p.add_argument("--audio", type=str, help="Audio path (for file-based run)")
    p.add_argument("--speaker", type=str, default="", help="Speaker name if no face match")
    args = p.parse_args()
    if args.camera:
        run_camera_loop(args.duration)
    elif args.image and args.audio:
        run_once_with_file(args.image, args.audio, args.speaker)
    else:
        print("Use --camera or --image + --audio (+ optional --speaker)")
