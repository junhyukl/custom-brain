# Git에서 제외할 항목 정리

저장소에 커밋하면 안 되거나, 이미 실수로 올렸다면 빼야 할 것들입니다.

## 1. .gitignore에 이미 반영된 항목

| 구분 | 경로/패턴 | 설명 |
|------|-----------|------|
| **의존성** | `node_modules/`, `**/node_modules/` | npm/pnpm 의존성 (루트, frontend 포함) |
| **pnpm** | `.pnpm/`, `.pnpm-store/` | pnpm 스토어·캐시 |
| **실행 스크립트** | `**/.bin/` | node_modules 내 바이너리 링크 |
| **빌드 결과** | `/dist`, `/build`, `frontend/dist/` | Nest·Vite 등 빌드 산출물 |
| **lockfile** | `package-lock.json` | pnpm 사용 시 npm lock 제외 |
| **로그** | `*.log`, `pnpm-debug.log*` 등 | 런타임 로그 |
| **OS** | `.DS_Store` | macOS 메타데이터 |
| **테스트** | `/coverage`, `/.nyc_output` | 커버리지 리포트 |
| **IDE** | `.idea`, `.vscode/*` (일부 제외) | 에디터 설정 |
| **환경 변수** | `.env`, `.env.*.local` | 비밀/설정 (복사용 `.env.example`만 커밋) |
| **임시** | `.temp`, `.tmp` | 임시 디렉터리 |
| **brain-data** | `brain-data/personal/*`, `brain-data/family/*`, `brain-data/upload/*` | 사진·문서·업로드 파일 (용량·민감 정보). `.gitkeep`만 유지 |
| **Qdrant** | `qdrant_storage/` | 벡터 DB 로컬 스토리지 |
| **Python** | `.venv/`, `venv/`, `__pycache__/`, `*.pyc`, `.pytest_cache/` | ai-service, face-service 가상환경·캐시 |

## 2. 이미 커밋된 항목을 Git에서만 제거하기

다음이 이미 `git add`/커밋되어 있다면, **로컬 파일은 지우지 않고** 인덱스에서만 제거할 수 있습니다.

```bash
# frontend 의존성·빌드 결과 추적 해제 (파일은 그대로 둠)
git rm -r --cached frontend/node_modules 2>/dev/null || true
git rm -r --cached frontend/dist 2>/dev/null || true

# 루트 node_modules (있다면)
git rm -r --cached node_modules 2>/dev/null || true
```

이후 `.gitignore`가 적용되므로 다시 `git add` 해도 해당 경로는 올라가지 않습니다. 커밋 메시지 예: `chore: stop tracking frontend/node_modules and frontend/dist`.

## 3. 정리 요약

- **반드시 제외**: `node_modules`, `frontend/dist`, `.env`, `brain-data` 내 실제 파일, `qdrant_storage`, `.venv`/`venv`
- **선택 제외**: `frontend/dist`(빌드 시 재생성), 로그·coverage
- **커밋해도 되는 것**: `.env.example`, `brain-data/**/.gitkeep`, `.vscode/settings.json` 등 예시·공용 설정
