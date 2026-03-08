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

---

## 10. Pro 수준 분석 및 고도화

- **분석**: 아키텍처·API·프론트·신뢰성·보안·성능·유지보수 관점으로 7개 영역 분석 보고서 작성.
- **헬스 체크**: `GET /health` 추가. Mongo·Qdrant 연결 확인, 200=정상·503=비가용. `src/health/` (HealthService, HealthController, HealthModule), MongoService.ping() 추가.
- **CORS**: `CORS_ORIGIN` env 설정 시 해당 origin만 허용(쉼표 구분). 미설정 시 기존처럼 모든 origin 허용.
- **에러 처리**: BrainRoutes(chat, ask, organize)·FamilyController.createPerson에 try/catch 적용, toErrorMessage + HttpException으로 일관된 에러 응답.
- **탭 a11y**: App.tsx 네비에 role="tablist", 각 버튼에 role="tab", aria-selected, aria-controls, tabpanel에 role="tabpanel", aria-labelledby 연결.
- **문서**: README에 GET / (Root), GET /health (헬스 체크) 구분, 환경 변수 CORS_ORIGIN, 프로젝트 구조에 health/ 반영. .env.example에 CORS_ORIGIN 주석 추가.

---

---

## 11. Voice Memory (음성 메모리)

- **스키마·설정**
  - `MemoryType`에 `'voice'` 추가, `MemoryMetadata`에 선택 `speaker` 추가. `STORAGE_CONFIG.personal.voice` 경로, `VOICE_EXT_REGEX`(mp3, wav, m4a, webm, ogg, flac) 상수.
- **업로드**
  - `POST /brain/upload/voice`: multipart `file` + 선택 body `speaker`. 저장 → ai-service Whisper STT → 텍스트를 메모리로 저장(type: voice, metadata.filePath, metadata.speaker). `AI_SERVICE_URL` 미설정 시 안내 메시지 반환.
- **ai-service**
  - `POST /transcribe`: body `{ "path": "<로컬 파일 경로>" }` → Whisper로 음성→텍스트, `{ "text": "..." }` 반환. env `WHISPER_MODEL`(기본 `base`).
- **프론트엔드**
  - 업로드 UI에 "음성 (MP3/WAV/M4A 등 → Whisper STT)" 블록: 파일 선택 + 선택 입력 "화자(예: 아버지)".
- **기타**
  - `brain-data/personal/voice/` .gitkeep 추가, `.gitignore`에 `brain-data/personal/voice/*` 제외 규칙. 배치 업로드·3분 스캔에는 음성 미포함(수동 업로드·API만).

---

## 12. 프로덕션 수준 Face Recognition + Voice Memory + Neo4j 그래프

- **Face (InsightFace)**
  - **face-service**: `POST /analyze-face` 추가 — body `{ "path": "..." }` 로컬 경로로 분석(동일 호스트/공유 볼륨). `INSIGHTFACE_GPU=1` 시 CUDA 시도. 기존 `POST /detect`(multipart) 유지.
  - **Nest FaceService**: `detectFromPath(filePath)` 추가 → face-service `/analyze-face` 호출. 사진 파이프라인에서 경로 있으면 path 우선 사용 후 필요 시 buffer fallback.
  - **사진 파이프라인**: AI Service 경로(processPhotoViaAiService)에서도 FACE_SERVICE_URL 있으면 얼굴 검출·매칭·미등록 시 자동 인물 생성 및 Qdrant faces 등록. Legacy 경로에서도 `detectFromPath` 우선, 실패 시 `detectFromBuffer`.
- **Neo4j Person–Memory 연결**
  - **FamilyGraphService**: `linkPersonToPhoto(personName, memoryId)` — `(Person)-[:APPEARS_IN]->(Memory)`, `linkPersonToVoice(personName, memoryId)` — `(Person)-[:SPOKE]->(Memory)`. 메모리 저장 시 타입별로 호출.
  - 사진 업로드 후 메모리 저장 시 등장 인물별 `linkPersonToPhoto` 호출. 음성 업로드 시 화자(speaker) 있으면 `linkPersonToVoice` 호출.
- **Voice + 화자 구분**
  - **ai-service**: `POST /transcribe-with-speakers` — Whisper STT + 선택적 pyannote.audio 화자 구분. `HUGGINGFACE_TOKEN` 또는 `PYANNOTE_TOKEN` 있으면 `segments: [{ speaker, start, end }]` 반환. 의존성: `pyannote-audio`, `torch`.
  - **Nest**: 음성 업로드 시 `transcribeWithSpeakers` 사용, 실패 시 `transcribe` fallback. 메타데이터에 `speaker`(폼 입력) 또는 diarization 결과 `speakers`(SPEAKER_00 등) 저장. 화자 이름이 있으면 Neo4j `SPOKE` 연결.
- **스키마**
  - `MemoryMetadata`에 `speakers?: string[]` 추가(화자 구분 목록).
- **테스트**
  - `family-graph.service.spec.ts`: `linkPersonToPhoto`, `linkPersonToVoice` 호출 검증 및 빈 이름/메모리 ID·Neo4j 비가용 시 no-op 검증.

---

## 13. Face + Voice + Family Graph 모듈형 시스템 (ai_family_system)

- **모듈형 Python 패키지** `ai_family_system/`
  - config, face(face_detect, face_recognize, face_database), voice(voice_record, speech_to_text, voice_memory), memory(memory_store), family_graph(graph_db, family_relation), utils/logger.
  - Nest API·Face-service·AI-service·Neo4j 연동; 로컬 fallback(로컬 DB, Whisper, Neo4j 직접).
  - `main.py`: `--camera` 루프 또는 `--image` + `--audio` 파일 기반 1회.
- **Nest**
  - `POST /brain/face/match`: body `{ embedding }` → FaceService.findPerson → `{ personId, personName }` (ai_family_system 연동).
  - `POST /brain/family/graph/relation`: body `{ from, relation, to }` → FamilyGraphService.addRelation (화이트리스트: FATHER, MOTHER, BROTHER 등).
  - **Voice → Graph 자동 연결**: 음성 업로드 후 화자(speaker) 있으면 `relation-extract.util`로 텍스트에서 관계 추출 → `addRelation` 호출 (예: "my father is Mike" → John -[FATHER]-> Mike).
- **relation-extract.util**: 정규식 기반 관계 추출, `extractRelationsFromText(speaker, text)` → `[{ from, relation, to }]`.
- **테스트**: `family-graph.service.spec.ts`에 addRelation 검증, `relation-extract.util.spec.ts` 추가.

---

## 14. Pro 10인급 분석 및 리팩터링·고도화

- **분석 문서** `docs/PRO_ANALYSIS.md`
  - 10개 관점: 아키텍처, API 설계, 코드 품질, 보안, 성능, 테스트, 운영·DevOps, 프론트엔드, 데이터·DB, 유지보수. 각 영역별 현황·개선 방향·우선순위 표 정리.
- **Global Exception Filter** `src/common/http-exception.filter.ts`
  - 모든 예외를 `{ success: false, error, code? }` 형식으로 통일. HttpException 시 기존 response body 유지(health 503 등). 비Http 예외는 500 + toErrorMessage.
- **Bootstrap**
  - `validateEnv()`: PORT 유효성(1–65535) 검사, 실패 시 시작 중단. `createApp()`에 `useGlobalFilters(GlobalExceptionFilter)` 적용. 시작 시 Logger로 listen 포트 출력.
- **공통 타입** `src/common/api-response.types.ts`
  - ApiErrorResponse, ApiSuccessResponse, ApiResponse, isApiError.
- **상수**
  - `HTTP_TIMEOUT_DEFAULT`, `HTTP_TIMEOUT_LONG` (외부 호출 타임아웃 참조용).
- **MemoryController**
  - POST /memory: content 필수·비어 있으면 BadRequestException. create/delete/clearAll에 try/catch → HttpException으로 일관된 에러 응답.
- **BrainRoutes**
  - Nest Logger 주입, console.error 대신 logger.warn으로 chat/ask/organize 실패 로깅.
- **문서**
  - `docs/README.md`에 PRO_ANALYSIS.md 링크 추가.

---

## 15. 인증 (2FA + Passkey, Mongo)

- **스키마·상수**
  - `src/schemas/user.schema.ts`: User (id, email, passwordHash, role?, totpSecret?, passkeyCredentials?, apiKeys?, createdAt), PasskeyCredential, ApiKeyEntry (id, keyHash, name?, createdAt), UserRole = 'admin' | 'manager' | 'user'. Mongo 컬렉션 `users` (`MONGO_COLLECTION_USERS`).
  - `src/common/constants.ts`: `SKIP_AUTH`(로컬/테스트 시 true), `JWT_SECRET`, `JWT_EXPIRES_IN`, `MONGO_COLLECTION_USERS`.
- **2FA (비밀번호 + OTP)**
  - 회원가입: `POST /auth/register` (email, password) → bcrypt 해시 저장, JWT 발급. 첫 가입자는 role=admin, 이후 user.
  - 로그인: `POST /auth/login` → TOTP 미설정 시 JWT, 설정 시 `{ requiresOtp: true, tempToken }`. `POST /auth/verify-otp` (tempToken, otp) → JWT.
  - OTP 설정: `POST /auth/setup-otp` (인증 필수) → speakeasy 시크릿·otpauth URL 반환, 사용자 문서에 totpSecret 저장.
- **Passkey (WebAuthn, FaceID/지문/기기 잠금 해제)**
  - 등록: `GET /auth/passkey/register/options`, `POST /auth/passkey/register` (인증 필수) → 검증 후 passkeyCredentials에 저장.
  - 인증: `GET /auth/passkey/auth/options`, `POST /auth/passkey/auth` (공개) → 검증 후 JWT 발급.
  - `@simplewebauthn/server` 사용. env: `AUTH_RP_NAME`, `AUTH_RP_ID`, `AUTH_ORIGIN` (기본 localhost).
- **사용자 역할·관리**
  - 역할: admin, manager, user. JWT·API 키 인증 시 `req.user.role` 설정.
  - `GET /auth/me` (인증 필수): 현재 사용자 id, email, role.
  - `RolesGuard` + `@Roles('admin')`: `GET /auth/admin/users`, `PATCH /auth/admin/users/:id/role` (body: `{ role }`) — admin 전용.
- **API 키 (사용자별)**
  - 생성: `POST /auth/api-keys` (body: `name?`) → `{ id, name, key, createdAt }`. 평문 `key`는 이 응답에서만 확인 가능, DB에는 SHA-256 해시만 저장.
  - 목록: `GET /auth/api-keys` → `{ id, name?, createdAt }[]`.
  - 폐기: `DELETE /auth/api-keys/:id`.
  - API 호출 시 인증: `Authorization: Bearer <JWT>` 또는 `X-API-Key: <key>` 또는 `Authorization: ApiKey <key>`. 키 접두사 `cb_`.
- **가드·공개 라우트**
  - `GlobalAuthGuard`: `SKIP_AUTH` 또는 `NODE_ENV=test` 이면 항상 통과. 그 외 `@Public()` 없으면 JWT 또는 API 키 검사.
  - `@Public()`: register, login, verify-otp, passkey/auth/options, passkey/auth. `/brain/*` 등은 인증 필요(SKIP_AUTH false 시).
- **모듈**
  - `AuthModule`: MongoModule, JwtModule, AuthService, AuthController, APP_GUARD(GlobalAuthGuard). AppModule에 import.

---

## 16. 시드 유저 + 로컬 로그인 UI

- **시드 유저**
  - `AuthSeedService`: 앱 기동 시 `users` 컬렉션이 비어 있으면 `junhyukl@gmail.com` / `1234AB!` (role: admin) 자동 생성. `src/auth/auth-seed.service.ts`, AuthModule에 등록.
- **프론트엔드 로그인**
  - `Login.tsx`: 이메일·비밀번호 폼 → `POST /auth/login` → JWT를 `localStorage.auth_token`에 저장.
  - `App.tsx`: 토큰 없으면 로그인 화면, 있으면 메인 탭 + 로그아웃 버튼. 401 시 `auth:logout` 이벤트로 로그인 화면 복귀.
  - `main.tsx`: axios 401 응답 시 토큰 제거 + `auth:logout` 디스패치. 요청 시 `AUTH_TOKEN_KEY`(constants)에서 JWT 또는 `VITE_API_KEY` 헤더 첨부.
  - `vite.config.ts`: `/auth` 프록시 추가 (백엔드 3001).

---

*마지막 갱신: version1 브랜치 기준.*
