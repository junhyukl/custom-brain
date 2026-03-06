# Face Recognition + Family Graph (기존 구조 연동)

목표: **사진 업로드 → 얼굴 인식 → 사람 식별 → Family Graph 자동 업데이트**

## 1. 전체 흐름

```
Photo Upload (POST /brain/upload/photo)
     │
     ▼
Face Detection
     ├─ FACE_SERVICE_URL 있음 → Python InsightFace 서비스로 임베딩 추출
     └─ 없음 → 기존 face-api (faces.json) 로 로컬 매칭
     │
     ▼
기존 얼굴과 비교 (Qdrant 컬렉션 `faces`)
     ├─ 매칭됨 (score ≥ 0.8) → 해당 personId 사용
     └─ 미매칭 → 새 Person 생성 + Qdrant에 얼굴 등록
     │
     ▼
Family Graph 업데이트 (MongoDB `graph_edges`)
     └─ 사진에 함께 등장한 두 인물마다 `photo_together` 엣지 추가
     │
     ▼
메모리 저장 (설명 + metadata.people, metadata.personIds)
```

## 2. 구성 요소

| 요소 | 설명 |
|------|------|
| **face-service/** | Python FastAPI + InsightFace. `POST /detect` 로 이미지 → `{ faces: [{ embedding, bbox }] }` |
| **FaceService** | NestJS. Python 호출, Qdrant `faces` 컬렉션 매칭/등록 (`findPerson`, `storeFace`) |
| **FamilyService** | `addPhotoTogetherEdge`, `getGraph`. MongoDB `graph_edges` + persons |
| **PhotoProcessService** | 사진 처리 시 FaceService/FamilyService 호출해 그래프 자동 갱신 |

## 3. 실행 방법

### Python Face Service (선택)

```bash
cd face-service
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8001
```

### NestJS에서 연동

```bash
# Face Service 사용 시
FACE_SERVICE_URL=http://localhost:8001 pnpm run start:dev
```

- `FACE_SERVICE_URL` 이 없으면 기존 **face-api + faces.json** 만 사용 (변경 없음).
- 있으면 업로드 시 **InsightFace** 로 얼굴 검출 → Qdrant `faces` 에 매칭/등록 → **Family Graph** 에 `photo_together` 엣지 추가.

## 4. API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/brain/upload/photo` | 사진 업로드 → 얼굴 인식 → 그래프 갱신 → 메모리 저장 |
| GET | `/brain/family/graph` | `{ nodes, edges }` (persons + parent / photo_together) |
| GET | `/brain/family/tree` | 기존 가족 트리 (parentIds 기준) |

## 5. 검색 예: "Will 사진 보여줘"

1. 사용자 질문 → RAG/검색 시 `people` 또는 `personIds` 로 필터 가능 (현재 메모리 검색은 벡터+메타데이터).
2. `personIds` 가 메모리에 있으면, 해당 person 이 포함된 사진이 검색 결과에 포함됨.
3. (선택) 전용 API: `GET /brain/photos/search?person=Will` 처럼 person 이름으로 사진 검색 가능하도록 확장할 수 있음.

## 6. 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `FACE_SERVICE_URL` | (없음) | InsightFace Face Service URL. 있으면 업로드 시 이 서비스 사용 |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant (메모리 + `faces` 컬렉션) |

## 7. Qdrant 컬렉션

- **memories**: 기존 메모리 벡터 (768차원).
- **faces**: 얼굴 임베딩 (512차원, InsightFace). payload: `personId`, `personName`, `photoPath`.

## 8. MongoDB 컬렉션

- **persons**: 기존. `id`, `name`, `relation`, `parentIds` 등.
- **graph_edges**: 새로 사용. `from`, `to`, `type` (`parent` | `photo_together`), `photoPath`, `createdAt`.
