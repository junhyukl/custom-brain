#!/usr/bin/env bash
# 샘플 이미지 3장 + PDF 2개를 data/images, data/documents 에 다운로드합니다.
# 실행: ./scripts/download-sample-data.sh (또는 bash scripts/download-sample-data.sh)
# 요구: curl

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/data"
IMAGES_DIR="$DATA_DIR/images"
DOCUMENTS_DIR="$DATA_DIR/documents"

mkdir -p "$IMAGES_DIR" "$DOCUMENTS_DIR"

# 샘플 이미지 (Picsum Photos, seed로 고정 URL)
echo "Downloading sample images..."
curl -sL -o "$IMAGES_DIR/family_trip_1975.jpg" "https://picsum.photos/seed/family-trip-1975/400/300"
curl -sL -o "$IMAGES_DIR/grandma_birthday_1980.jpg" "https://picsum.photos/seed/grandma-birthday-1980/400/300"
curl -sL -o "$IMAGES_DIR/parents_wedding_2000.jpg" "https://picsum.photos/seed/parents-wedding-2000/400/300"

# 샘플 PDF (공개 샘플)
echo "Downloading sample PDFs..."
curl -sL -o "$DOCUMENTS_DIR/family_letter_1970.pdf" "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf"
curl -sL -o "$DOCUMENTS_DIR/family_event_1985.pdf" "https://www.africau.edu/images/default/sample.pdf"

echo "Done. Sample files:"
ls -la "$IMAGES_DIR"/*.jpg 2>/dev/null || true
ls -la "$DOCUMENTS_DIR"/*.pdf 2>/dev/null || true
