# Repository structure (GitHub 배포용)

이 문서는 리포지터리의 디렉터리/파일 구조와 역할을 정리한 것입니다.

```
custom-brain/
├── .dockerignore
├── .gitignore
├── .prettierrc
├── Dockerfile              # 프로덕션 이미지 빌드
├── docker-compose.yml      # 앱 + Qdrant 로컬 실행
├── README.md               # 프로젝트 설명, API, 실행 방법
├── REPO_STRUCTURE.md       # (이 파일은 docs/ 에 있음)
├── package.json
├── pnpm-lock.yaml
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.mjs
│
├── public/                 # Family Brain 웹 UI (정적)
│   ├── index.html
│   ├── style.css
│   └── main.js
│
├── data/                   # 가족 메모리 데이터
│   ├── family_texts.json   # 텍스트 기록 (initialize 시 로드)
│   ├── README.md
│   ├── images/             # 사진 (샘플 다운로드: pnpm run sample:download)
│   │   ├── .gitkeep
│   │   └── README.txt
│   └── documents/          # PDF/TXT/MD
│       ├── .gitkeep
│       ├── README.txt
│       └── family_story_1975.txt
│
├── scripts/
│   ├── download-sample-data.sh   # 샘플 이미지 3장 + PDF 2개 다운로드
│   └── query-family-brain.js    # OpenClaw 스타일 CLI 질의
│
├── docs/
│   ├── REPO_STRUCTURE.md   # 이 파일
│   ├── openclaw-family.md  # OpenClaw Agent 연동 예제
│   └── openclaw/
│       └── custom-brain/
│           └── SKILL.md    # OpenClaw 스킬 정의
│
├── test/
│   ├── app.e2e-spec.ts
│   ├── brain.e2e-spec.ts
│   └── jest-e2e.json
│
└── src/
    ├── main.ts
    ├── app.ts
    ├── app.module.ts
    ├── app.controller.ts
    ├── app.service.ts
    ├── test-runner.service.ts
    ├── common/
    │   ├── constants.ts
    │   ├── llmJson.ts
    │   └── promptHelpers.ts
    ├── brain/
    │   ├── brain.module.ts
    │   ├── memory.service.ts
    │   ├── memoryEvaluator.service.ts
    │   ├── rag.service.ts
    │   ├── askBrain.service.ts
    │   ├── embedding.service.ts
    │   ├── agentMemory.service.ts
    │   ├── mongoQuery.service.ts
    │   ├── mongoExplain.service.ts
    │   ├── codeLoader.service.ts
    │   ├── codeParser.service.ts
    │   ├── codeMemory.service.ts
    │   ├── codeRag.service.ts
    │   ├── codeIndex.service.ts
    │   ├── familyMemory.service.ts
    │   ├── familyInitialize.service.ts
    │   ├── types/
    │   │   ├── mongo.types.ts
    │   │   └── code.types.ts
    │   └── dto/
    │       ├── chat.dto.ts
    │       ├── ask.dto.ts
    │       ├── mongoAsk.dto.ts
    │       ├── codeAsk.dto.ts
    │       ├── codeIndex.dto.ts
    │       ├── storeMemory.dto.ts
    │       ├── searchMemory.dto.ts
    │       ├── brainQuery.dto.ts
    │       ├── addFamilyFolder.dto.ts
    │       ├── addFamilyPhoto.dto.ts
    │       └── addFamilyDocument.dto.ts
    ├── routes/
    │   └── brain.routes.ts
    ├── vector/
    │   └── vectorStore.ts
    ├── db/
    │   ├── database.module.ts
    │   └── database.service.ts
    ├── llm/
    │   ├── llm.module.ts
    │   └── llmClient.ts
    └── tools/
        ├── tools.module.ts
        ├── storeMemory.tool.ts
        ├── searchMemory.tool.ts
        └── queryKnowledge.tool.ts
```

## 주요 진입점

| 용도 | 경로 |
|------|------|
| 앱 부트스트랩 | `src/main.ts` → `src/app.ts` |
| Brain API 라우트 | `src/routes/brain.routes.ts` |
| 웹 UI | `public/index.html` (GET /) |
| 가족 초기화 | POST /brain/family/initialize (데이터: `data/family_texts.json` + data/images, data/documents) |

## 배포 시 포함 파일

- **소스**: `src/`, `public/`, `data/` (family_texts.json, documents/family_story_1975.txt 등)
- **설정**: package.json, pnpm-lock.yaml, nest-cli.json, tsconfig*.json
- **Docker**: Dockerfile, docker-compose.yml, .dockerignore
- **문서**: README.md, data/README.md, docs/openclaw-family.md, docs/REPO_STRUCTURE.md

샘플 이미지/PDF는 `pnpm run sample:download` 로 다운로드 후 `data/images`, `data/documents` 에 생성됩니다.
