# 가족 메모리 데이터

- **images/** — 가족 사진 (jpg, png, gif, webp). `POST /brain/family/addFolder` 또는 `addPhoto`로 추가.
- **documents/** — 가족 문서 (PDF, TXT, MD). `POST /brain/family/addFolder` 또는 `addDocument`로 추가.

저장 시 LLM이 설명/요약을 생성해 메모리(벡터)에 넣고, `/brain/search`·`/brain/ask`로 검색·질문할 수 있습니다.
