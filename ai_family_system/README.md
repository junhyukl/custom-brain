# ai_family_system

**Face Recognition + Voice Memory + Family Graph** 자동 연결을 위한 모듈형 Python 패키지(Production 수준 구조).

기존 custom-brain 스택과 연동:
- **NestJS** API: 메모리 저장, Face Match, Family Graph 관계
- **Face-service** (InsightFace): 얼굴 검출·임베딩
- **AI-service**: Whisper STT
- **Neo4j**: Person–Person 관계 (FATHER, MOTHER, BROTHER 등)

## 구조

```
ai_family_system/
├── main.py              # 진입점 (카메라 루프 또는 파일 기반 1회)
├── config/
│   └── config.py        # NEST_API_URL, FACE_SERVICE_URL, NEO4J_URI 등
├── face/
│   ├── face_detect.py   # 검출 (path/buffer → face-service 또는 로컬)
│   ├── face_recognize.py # 인물 식별 (Nest /brain/face/match 또는 로컬 DB)
│   └── face_database.py # 로컬 얼굴 DB (pickle)
├── voice/
│   ├── voice_record.py  # 녹음 (sounddevice)
│   ├── speech_to_text.py # STT (ai-service /transcribe 또는 로컬 Whisper)
│   └── voice_memory.py  # 메모리 저장 + 관계 추론 → Nest/Neo4j
├── memory/
│   └── memory_store.py  # 로컬 SQLite 또는 Nest API
├── family_graph/
│   ├── graph_db.py      # Neo4j Person MERGE, add_relation
│   └── family_relation.py
└── utils/
    └── logger.py
```

## 동작 흐름

1. **Camera / Image** → Face 검출 → 인물 식별 (Nest `/brain/face/match` 또는 로컬 DB)
2. **Microphone** → 녹음 → **Speech → Text** (Whisper)
3. **Voice Memory** 저장 (Nest `POST /brain/memory` 또는 로컬 SQLite)
4. **Family Graph** 자동 업데이트: 텍스트에서 "my father is Mike" 등 추출 → `POST /brain/family/graph/relation`

## 실행

프로젝트 루트에서:

```bash
# 패키지 경로 추가 후 실행
PYTHONPATH=. python -m ai_family_system.main --camera --duration 5
# 또는 이미지+음성 파일로 1회
PYTHONPATH=. python -m ai_family_system.main --image path/to/photo.jpg --audio path/to/voice.wav --speaker John
```

환경 변수 (선택):
- `NEST_API_URL`: Nest API (기본 http://localhost:3001)
- `FACE_SERVICE_URL`: InsightFace 서비스 (기본 http://localhost:8001)
- `AI_SERVICE_URL`: Whisper/STT (기본 http://localhost:8000)
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`: Neo4j
- `USE_NEST_API=true`: Nest 연동 사용 (기본 true)

## Nest API 연동

- `POST /brain/face/match` — body `{ "embedding": number[] }` → `{ personId, personName }` (Qdrant faces 기반)
- `POST /brain/family/graph/relation` — body `{ "from", "relation", "to" }` → Person–관계–Person 추가 (FATHER, MOTHER, BROTHER 등 화이트리스트)

Voice 업로드 시 Nest는 음성 텍스트에서 관계를 추출해 자동으로 `addRelation`을 호출합니다.
