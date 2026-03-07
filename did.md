# 지금까지 한 작업 (did.md)

이 문서는 custom-brain 프로젝트에서 진행한 주요 작업을 정리한 것입니다.

---

## 1. 문서·README

- **README 전면 정리**
  - 주요 기능 테이블, 스택, 시작하기, 기능 상세(채팅·질의, 메모리·검색, 업로드, 대량 수집, 가족, v3 Self-Learning, 에이전트·UI), API 요약, 스크립트 요약, 환경 변수, 프로젝트 구조, 테스트, OpenClaw 연동으로 재구성.
  - 아키텍처 링크: `docs/ARCHITECTURE.md`, `docs/README.md`.

- **docs 폴더 통합**
  - `docs/ARCHITECTURE.md`: 통합 아키텍처 문서 (개요, 시스템 구성, §3.1 업로드 파이프라인, §3.2 얼굴/가족, §3.3 v3 Self-Learning, §4 구조, §5 env/Docker, §6 API).
  - `docs/README.md`: 문서 인덱스 및 이전 개별 문서 → ARCHITECTURE 매핑.
  - `ARCHITECTURE_V2.md`, `ARCHITECTURE_V3.md`, `FACE_RECOGNITION_AND_FAMILY_GRAPH.md`, `STRUCTURE.md`: 짧은 리다이렉트로 통합 문서 참조하도록 변경.

---

## 2. DOCX 업로드

- **DOCX 지원**
  - 문서 업로드에 DOCX 포함 (PDF/DOCX/TXT/MD). `docx` 패키지(devDependency) 사용.
  - `scripts/test-upload-document.ts`: DOCX 케이스 추가 (샘플 DOCX 생성 후 `/brain/upload/document` 업로드).
  - `src/upload/upload.service.spec.ts`: “accepts .docx for document upload” 테스트 추가.
  - `pnpm run test:upload-document` 로 문서 업로드 API 테스트 가능 (백엔드 실행 중).

---

## 3. 배치 업로드 (Batch Upload)

- **프론트엔드 배치 업로드**
  - `frontend/src/components/batchUpload/fileTypes.ts`: `getUploadType(file)` — 사진(jpg/jpeg/png/webp), 문서(pdf/docx/txt/md) 구분.
  - `frontend/src/components/batchUpload/BatchUpload.tsx`: 드롭존, 큐, “배치 실행” 시 파일별로 `/brain/upload/photo` 또는 `/brain/upload/document` 호출, 상태(pending/uploading/done/error/skipped), 서버 `success: false` 시 에러 처리.
  - `frontend/src/components/batchUpload/index.ts`: export.
  - `frontend/src/components/Upload.tsx`: 단일 업로드 아래 `<BatchUpload />` 통합.

- **폴더 배치 잡 (batch-upload-from-folder)**
  - `brain-data/upload`에 파일을 복사해 넣고 `pnpm run batch-upload` 실행 시 UI와 동일하게 `/brain/upload/photo`, `/brain/upload/document`로 전송.
  - `scripts/batch-upload-from-folder.js`: 확장자별 분류, API 전송, 성공 시 `upload/processed/`로 이동. env: `UPLOAD_FOLDER`, `BRAIN_API_URL`.
  - `brain-data/upload/`, `brain-data/upload/processed/` .gitkeep 추가. README·스크립트 요약에 반영.

---

## 4. 스크립트·실행

- **개발용 스크립트**
  - `package.json`에 `"dev": "node scripts/start-all.js"` 추가. `pnpm run dev` = `pnpm run start:all` (Docker + Nest + ai-service + face-service + UI 동시 실행).
  - README 스크립트 요약에 `pnpm run dev` 및 `start:dev` 설명 보강.

---

## 5. OpenClaw 연동

- **스킬 문서**
  - `docs/openclaw/custom-brain/SKILL.md`: Agent Tools 섹션 추가 — searchMemory, searchPhotos, searchDocuments, timeline, familyTree (Method, URL, Query/Body, 응답). 에이전트 질문→검색→LLM 답변 흐름 및 `pnpm run run-agent` 안내.

---

## 6. Git·버전 브랜치

- **version1 브랜치**
  - `version1` 브랜치 생성 (`git checkout -b version1`).
  - 원격 푸시: `git push -u origin version1`.
  - 앞으로 큰 버전이 바뀔 때마다 `version2`, `version3` … 브랜치를 만들어 푸시하는 방식으로 사용 예정.

---

## 7. 기타 (브랜치 대비 main 기준 변경 요약)

- `.env.example`, `.gitignore` (brain-data, Python, qdrant_storage 등), `.vscode/settings.json`
- Docker: `docker-compose.yml`, `docker-up.ps1`, `docker/docker-compose.yml` (Qdrant, Mongo, ai-service, Neo4j)
- **ai-service** (Python FastAPI): Vision caption, Embed, v3 cluster/summarize/timeline
- **face-service** (Python): InsightFace 얼굴 검출·embedding
- **frontend**: React 웹 UI (업로드, 검색, Timeline, Family Graph), 빌드 산출물 `frontend/dist/`
- **brain-data** 구조: personal/family 하위 .gitkeep 및 faces_src 안내

---

---

## 8. 질문(Ask) UI

- **웹 UI "질문" 탭 복구**
  - `frontend/src/components/Ask.tsx`: 질문 입력 → `POST /brain/ask` → 답변 표시, `GET /brain/memory`로 최근 대화(접기) 표시.
  - `App.tsx`: 탭에 "질문"(ask) 추가.
  - **백엔드**: `POST /brain/ask` 처리 시 질문/답변을 `AgentMemoryService`에 append하도록 수정 → `GET /brain/memory`에 질문·답변이 함께 나옴 (서버 재시작 전까지. 세션 메모리는 휘발성).

---

## 9. Cursor 규칙 (작업 이력 참조)

- **`.cursor/rules/check-did.mdc`**: 사용자가 지시할 때 `did.md`를 먼저 확인하고, 이미 한 작업이 있으면 알려준 뒤 중복 없이 보완만 하도록 하는 규칙. `alwaysApply: true`.

---

*마지막 갱신: version1 브랜치 기준.*
