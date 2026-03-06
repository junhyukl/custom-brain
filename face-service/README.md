# Face Service (InsightFace)

사진에서 얼굴 검출 후 **embedding 벡터**를 반환합니다. custom-brain에서 이 서비스를 호출해 Qdrant `faces` 컬렉션에 저장·매칭합니다.

## 설치 및 실행

```bash
cd face-service
# Ubuntu/Debian: venv 미지원 시 한 번만 실행
#   sudo apt install python3.12-venv   # 또는 python3-venv
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8001
```

## API

- `POST /detect`: multipart/form-data로 이미지 파일 전송 → `{ "faces": [ { "embedding": number[], "bbox": number[] } ] }`
- `GET /health`: 상태 확인

## custom-brain 연동

환경 변수에 Face Service URL을 설정한 뒤 서버를 띄우면, 사진 업로드 시 자동으로 얼굴 인식 + Family Graph가 갱신됩니다.

```bash
FACE_SERVICE_URL=http://localhost:8001 pnpm run start:dev
```
