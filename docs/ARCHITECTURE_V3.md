# Custom Brain v3 — Self-Learning AI Brain

v2까지는 **저장 + 검색**이었고, v3에서는 **AI가 메모리를 자동 정리·연결·요약**합니다.

## 1. v3 핵심 기능

| 기능 | 설명 |
|------|------|
| **Memory clustering** | 벡터 KMeans 클러스터링 → 메모리별 `clusterId` 메타데이터 저장 |
| **Automatic timeline** | AI가 메모리 목록에서 시간순 타임라인 텍스트 생성 → 이벤트로 저장 |
| **Knowledge graph linking** | 메모리 `metadata.people`로 Neo4j Entity 노드·RELATED_TO 관계 생성 |
| **Self-summary** | AI가 메모리 목록 요약 → 이벤트로 저장 |
| **Daily digest** | 매일 새벽 3시 cron으로 클러스터·요약·지식그래프 갱신 |

## 2. 전체 구조 (v3)

```
custom-brain
├─ backend (NestJS)
│   ├─ upload, memory, search, brain, timeline, family
│   └─ v3: BrainOrganizeService, ScheduleModule (cron)
├─ ai-service (Python)
│   ├─ embedding, image caption, OCR
│   └─ v3: /cluster, /summarize, /timeline
├─ vector-db (Qdrant)
├─ graph-db (Neo4j) — Person, Entity, RELATED_TO
└─ llm (Ollama)
```

## 3. Self-Learning 메모리 엔진

정기 실행 흐름:

```
memory (recall)
  ↓
vector clustering (embedMany → /cluster)
  ↓
clusterId 메타데이터 저장
  ↓
timeline 생성 (/timeline) → addEvent
  ↓
knowledge graph (people → Neo4j Entity, RELATED_TO)
  ↓
summary 생성 (/summarize) → addEvent
```

## 4. API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/brain/organize` | v3 organize 한 번 실행 (cluster → timeline → graph → summaries) |

기존 `POST /brain/ask`는 메모리 검색 + LLM context로 답변 (변경 없음).

## 5. Python AI Service (v3 추가)

| 경로 | body | 설명 |
|------|------|------|
| POST | `/cluster` | `{ "vectors": number[][] }` | KMeans 클러스터링 → `{ "clusters": number[] }` |
| POST | `/summarize` | `{ "memories": string[] }` | LLM 요약 → `{ "summary": string }` |
| POST | `/timeline` | `{ "memories": string[] }` | LLM 시간순 타임라인 → `{ "timeline": string }` |

환경 변수: `LLM_MODEL` (기본 `mistral:7b-instruct`).

## 6. Knowledge Graph (Neo4j)

- **Entity** 노드: `MERGE (a:Entity {name: $a})`
- **RELATED_TO** 관계: 같은 메모리에 등장한 people 쌍을 연결  
  `MERGE (a)-[:RELATED_TO]->(b)`

Nest: `KnowledgeGraphService.linkKnowledge(a, b)`, `linkEntities(names[])`.

## 7. Cron

- **매일 03:00** `BrainOrganizeService.nightlyBrainUpdate()`  
  - `clusterMemories()`  
  - `generateSummaries()`  
  - `updateKnowledgeGraph()`  

타임라인 생성은 수동 `POST /brain/organize` 시에만 실행 (부하 조절).

## 8. 메모리 메타데이터 (v3)

- `metadata.clusterId`: KMeans 클러스터 레이블 (0..n-1)
- `metadata.clusterTopic`: (선택) 클러스터 주제 레이블

## 9. 실행 조건

- **AI_SERVICE_URL** 설정 시에만 클러스터·타임라인·요약 사용 (Python ai-service)
- **NEO4J_URI** 설정 시에만 지식 그래프 링크 사용
