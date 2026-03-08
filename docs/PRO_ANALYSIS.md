# Pro 수준 코드베이스 분석 (10인 관점)

custom-brain 프로젝트에 대한 다각도 분석 및 리팩터링·고도화 방향. 10개 관점(아키텍처, API, 코드품질, 보안, 성능, 테스트, 운영, 프론트, 데이터, 유지보수)으로 정리.

---

## 1. 아키텍처 (Architecture)

**현재**
- NestJS 모듈 분리: ApiModule, BrainModule, BrainCoreModule, IngestionModule, UploadModule, VisionModule, Neo4jModule, HealthModule 등. 관심사별로 나뉘어 있음.
- BrainRoutes가 BrainModule에 있고, Memory/Search/Timeline 등은 ApiModule에 있어 **라우팅 진입점이 두 군데** (brain.* vs api 컨트롤러). 신규 개발자가 “brain 메모리 API는 어디?” 찾을 때 혼동 가능.
- Python 서비스(ai-service, face-service)는 Nest에서 HTTP 클라이언트로 호출; 경로/환경이 분리되어 있어 **동일 호스트·공유 볼륨** 전제가 문서에만 있고 런타임 검증은 없음.

**개선**
- **단일 진입점 정리**: `brain/*` 라우트를 ApiModule 쪽으로 모으거나, BrainModule을 “도메인 오케스트레이션만” 두고 HTTP는 ApiModule에서만 처리하도록 역할을 명확히.
- **설정 검증**: bootstrap 시 필수 env(PORT, OLLAMA_URL 등) 검사 및 실패 시 명확한 메시지로 종료.
- **의존성 방향**: BrainCore → Mongo/Vector만 의존, Api/Upload가 BrainCore·Ingestion을 사용하는 현재 방향 유지. 순환 참조 없음.

---

## 2. API 설계 (API Design)

**현재**
- REST 스타일: GET/POST/PATCH/DELETE 사용. 메모리·검색·타임라인·업로드·가족·헬스 등 일관된 prefix (`/brain/*`, `/brain/family/*`).
- **에러 응답 형식 불일치**: 일부는 `{ error: string }`, 일부는 `HttpException` body가 다름. 업로드 응답은 `{ success: true, ... }` | `{ success: false, error }` 형태.
- **입력 검증**: DTO는 있으나 class-validator 미사용. `body.content` 등이 비어 있어도 서비스까지 전달됨.
- **페이징/한도**: `limit` 쿼리로 처리, parseLimit 유틸 있음. 기본값 상수화되어 있음.

**개선**
- **공통 에러 형식**: `{ success: false, error: string, code?: string }` 및 HTTP status 일치. Global Exception Filter로 통일.
- **DTO 검증**: 핵심 API(메모리 생성, chat, ask)에 class-validator 적용 또는 최소한 controller 단에서 빈 값/타입 체크 후 400 반환.
- **API 버저닝**: 현재 비버저닝. 장기적으로 `/v1/brain/*` 등 고려 가능(선택).

---

## 3. 코드 품질 (Code Quality)

**현재**
- TypeScript strict 활용. 스키마·DTO·서비스 간 타입 정의 있음.
- **중복**: `toErrorMessage`가 common과 frontend utils에 각각 존재(백엔드/axios 대응 차이로 의도적일 수 있음). agent-tools는 tools를 re-export하여 중복 제거됨.
- **매직 넘버/문자열**: 대부분 constants 또는 config로 정리됨. 일부 timeout(30_000, 120_000)은 상수로 빼면 가독성 향상.
- **네이밍**: 서비스·컨트롤러·모듈 이름 일관됨. 일부 파일명은 kebab (brain-organize.service) vs camel 혼재.

**개선**
- **에러 처리 패턴**: try/catch + toErrorMessage + HttpException 반복. Global Exception Filter로 catch 후 공통 포맷 반환하면 컨트롤러 코드 단순화.
- **로깅**: console.error/console.warn 다수. Nest Logger 또는 단일 Logger 서비스로 교체 시 운영 시 로그 레벨·포맷 통제 용이.
- **타임아웃 상수**: axios/fetch timeout을 common/constants 또는 config로 모으기.

---

## 4. 보안 (Security)

**현재**
- CORS: CORS_ORIGIN 설정 시 지정 origin만, 미설정 시 전체 허용(개발 편의).
- **인증/인가**: 없음. 내부·로컬 전제로 보임.
- **입력**: 파일 업로드 확장자·크기 제한 있음. body 파라미터는 DTO 타입만 있고 화이트리스트/길이 제한 없음.
- **비밀/키**: env에서 읽음. .env.example 존재.

**개선**
- **프로덕션 체크리스트**: CORS_ORIGIN 필수, 인증(API Key 또는 JWT) 도입 검토 문서화.
- **요청 크기**: body parser limit 명시(이미 업로드에 fileSize 제한 있음).
- **Rate limiting**: 공개 API가 된다면 추후 적용.

---

## 5. 성능 (Performance)

**현재**
- 사진/문서/음성 업로드 후 동기 파이프라인(저장 → Vision/STT → 임베딩 → 저장). 대용량 시 큐·백그라운드 작업 없음.
- Qdrant·Mongo·Neo4j 호출이 동기. 연결 풀/설정은 각 드라이버 기본값.
- 배치 업로드 스케줄(3분)으로 폴더 스캔.

**개선**
- **장기**: 무거운 처리(예: organize)를 큐(Bull 등)로 이관하면 API 응답 시간 안정화.
- **타임아웃**: 외부 호출(Ollama, ai-service, face-service) 타임아웃 이미 상수화. 실패 시 재시도/회로 차단기는 추후.
- **임베딩 배치**: 여러 메모리 한 번에 embed 호출 시 배치 API 있으면 호출 수 감소.

---

## 6. 테스트 (Testing)

**현재**
- 단위 테스트: Jest, 일부 서비스·유틸·neo4j·upload 등 .spec.ts 존재. coverage 설정 있음.
- **E2E**: jest-e2e.json 존재. 실제 E2E 시나리오는 제한적.
- **Mock**: fs, storage.config, S3 등 mock 사용. 외부 서비스 의존성 격리됨.

**개선**
- **컨트롤러 테스트**: MemoryController, UploadController 등 HTTP 레벨 테스트 추가 시 리그레션 방지.
- **통합 테스트**: Docker Compose로 Qdrant·Mongo 띄운 뒤 일부 시나리오(메모리 저장→검색) 자동화.
- **테스트 픽스처**: 공통 메모리/사용자 fixture를 test/fixtures로 두고 재사용.

---

## 7. 운영·DevOps (Operations)

**현재**
- 헬스: GET /health로 Mongo·Qdrant 상태 반환. 503은 아직 명시적이지 않을 수 있음(상태에 따라 200/503 구분 권장).
- **로깅**: 구조화되지 않음. JSON 로그 + 레벨(INFO/WARN/ERROR) 도입 시 수집·검색 용이.
- **환경**: PORT 등 env 사용. **bootstrap 시 필수 env 없으면 바로 실패**하도록 하면 배포 실수 감소.
- **스크립트**: start-all, batch-upload, ingest-* 등 정리됨. README에 요약 있음.

**개선**
- **헬스**: degraded 시 503, ok 시 200 명확히. readiness/liveness 분리 검토.
- **시작 시 검증**: PORT, OLLAMA_URL(또는 선택 서비스) 등 필수 항목 검사 후 listen.
- **로그**: Nest Logger 또는 Pino 등으로 요청 ID·경로·status·duration 출력.

---

## 8. 프론트엔드 (Frontend)

**현재**
- React + Vite, Tailwind. 탭 기반(업로드·검색·질문·메모·타임라인·Family).
- **접근성**: tablist, tab, tabpanel, aria-selected 등 적용됨.
- **에러 표시**: toErrorMessage(axios)로 사용자 메시지 표시. 일관된 토스트/알림 컴포넌트는 없음.
- **상태**: 로컬 useState. 전역 상태 관리 없음.

**개선**
- **API 레이어**: axios 인스턴스(baseURL, timeout, interceptors) 공통화. 401/403 시 공통 처리.
- **에러 UI**: 전역 알림/토스트 하나 두고, API 실패 시 메시지 표시.
- **로딩**: 업로드·질문 등 비동기 구간에 스켈레톤 또는 스피너 일관 적용.

---

## 9. 데이터·DB (Data & Persistence)

**현재**
- MongoDB: 메모리·가족 메타데이터. 스키마는 TypeScript 인터페이스로 정의.
- Qdrant: 메모리 벡터·faces 벡터. 컬렉션명 상수화.
- Neo4j: Person·Memory·APPEARS_IN/SPOKE/관계. 선택 사항.
- **마이그레이션**: 스키마 변경 시 버전·마이그레이션 스크립트 없음.

**개선**
- **스키마 버전**: 메모리 문서에 schemaVersion 필드 도입 시 향후 마이그레이션 경로 확보.
- **인덱스**: Mongo 컬렉션에 자주 조회하는 필드(id, createdAt 등) 인덱스 명시.
- **백업/복구**: 문서화 또는 스크립트로 dump/restore 안내.

---

## 10. 유지보수성 (Maintainability)

**현재**
- did.md로 “지금까지 한 작업” 추적. Cursor 규칙으로 did 확인 지시 있음.
- README·ARCHITECTURE·docs 정리됨. API 요약 테이블 있음.
- **의존성**: package.json 정리. Python은 requirements.txt 별도.

**개선**
- **CHANGELOG**: 버전별 변경 사항 요약(선택).
- **공통 타입**: API 응답 타입(Success<T>, ErrorResponse)을 common/types 또는 dto에 두고 재사용.
- **주석/TSDoc**: 공개 API(서비스 메서드·컨트롤러)에 한 줄 요약 추가 시 온보딩 속도 향상.

---

## 리팩터링·고도화 우선순위 (적용 항목)

| 우선순위 | 항목 | 비고 |
|----------|------|------|
| 1 | Global Exception Filter | 에러 응답 형식 통일, 컨트롤러 try/catch 축소 |
| 2 | Bootstrap env 검증 | PORT 등 필수 env 없으면 시작 실패 |
| 3 | 공통 API 응답 타입 | Success/Error shape 타입 정의 및 사용처 정리 |
| 4 | Nest Logger 주입 | 주요 서비스·라우트에서 Logger 사용, console 대체 |
| 5 | MemoryController 예외 처리 | create/update/delete 등 일관된 catch 및 4xx/5xx 반환 |
| 6 | 타임아웃 상수화 | axios/fetch timeout을 constants로 |
| 7 | (선택) DTO validation | class-validator 도입 시 핵심 API부터 |

이 문서는 위 우선순위를 반영한 리팩터링 후에도 “현재 상태”를 갱신해 두는 것을 권장합니다.
