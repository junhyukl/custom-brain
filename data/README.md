# 가족 메모리 데이터

이 폴더는 **Family Brain** 테스트용 데이터를 두는 곳입니다.

## 구조

```
data/
├── family_texts.json   # 텍스트 기록 (초기화 시 자동 로드)
├── images/             # 가족 사진 (jpg, png, gif, webp)
│   └── README.txt      # 예제 파일명 안내
└── documents/          # 가족 문서 (PDF, TXT, MD)
    └── README.txt      # 예제 파일명 안내
```

## 1. 텍스트 기록 (family_texts.json)

- 할아버지/할머니/부모님 생애, 가족 여행·모임 등 텍스트 + 메타데이터.
- **초기화** 시 자동으로 메모리(벡터)에 저장됩니다.

## 2. 사진 (images/)

- 예제 파일명: `family_trip_1975.jpg`, `grandma_birthday_1980.jpg`, `parents_wedding_2000.jpg`
- 실제 사진 파일을 넣은 뒤 **초기화** 또는 `POST /brain/family/addFolder` 로 일괄 저장.

## 3. 문서 (documents/)

- **포함된 예제**: `family_story_1975.txt` (1975년 가족 여행 일기). 초기화 시 자동으로 요약·저장됩니다.
- 추가 예제 파일명: `family_letter_1970.pdf`, `family_event_1985.pdf`
- PDF/TXT/MD를 넣은 뒤 **초기화** 또는 `POST /brain/family/addFolder` 로 일괄 저장.

## 초기화 (한 번에 로드)

서버 실행 후 다음을 한 번 호출하면 `family_texts.json` + `images/` + `documents/` 가 모두 메모리에 올라갑니다.

```bash
curl -X POST http://localhost:3001/brain/family/initialize
```

응답 예:

```json
{
  "textsLoaded": 7,
  "imagesAdded": 3,
  "documentsAdded": 2,
  "errors": []
}
```

이후 브라우저에서 http://localhost:3001/ 로 질문하거나, OpenClaw/스크립트에서 `POST /brain/ask` 로 질의하면 됩니다.
