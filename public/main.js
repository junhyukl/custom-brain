(function () {
  const askBtn = document.getElementById("askBtn");
  const questionEl = document.getElementById("question");
  const answerEl = document.getElementById("answer");
  const resultsEl = document.getElementById("results");

  function fileUrl(filePath) {
    if (!filePath) return null;
    return "/brain/family/file?path=" + encodeURIComponent(filePath);
  }

  function addResult(item) {
    const file = item.file || (item.metadata && item.metadata.file);
    const text = item.text || "";
    const ext = file ? file.split(".").pop().toLowerCase() : "";

    const card = document.createElement("div");
    card.className = "result-card";

    if (file) {
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        const img = document.createElement("img");
        img.src = fileUrl(file);
        img.alt = text.slice(0, 100);
        img.title = text;
        img.loading = "lazy";
        img.onerror = function () {
          img.style.display = "none";
          const fallback = document.createElement("div");
          fallback.className = "caption";
          fallback.textContent = text || "(이미지를 불러올 수 없습니다)";
          card.appendChild(fallback);
        };
        img.onclick = function () {
          window.open(fileUrl(file), "_blank");
        };
        card.appendChild(img);
      }
      if (["pdf", "txt", "md", "docx"].includes(ext) || card.children.length === 0) {
        const a = document.createElement("a");
        a.href = fileUrl(file);
        a.target = "_blank";
        a.rel = "noopener";
        a.className = "doc-link";
        a.textContent = (ext === "pdf" ? "📄 " : "📝 ") + (text.slice(0, 60) || file.split("/").pop() || "문서 보기");
        card.appendChild(a);
      }
      if (text && !["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        const cap = document.createElement("div");
        cap.className = "caption";
        cap.textContent = text.slice(0, 120) + (text.length > 120 ? "…" : "");
        card.appendChild(cap);
      }
    }
    if (!file || text) {
      if (card.children.length === 0) {
        card.className = "text-only";
        card.textContent = text || "(내용 없음)";
      } else if (text && ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        const cap = document.createElement("div");
        cap.className = "caption";
        cap.textContent = text.slice(0, 120) + (text.length > 120 ? "…" : "");
        card.appendChild(cap);
      }
    }

    if (card.children.length > 0) {
      resultsEl.appendChild(card);
    }
  }

  askBtn.addEventListener("click", async () => {
    const question = (questionEl.value || "").trim();
    if (!question) return;

    answerEl.textContent = "AI가 답변 중...";
    answerEl.className = "answer-section loading";
    resultsEl.innerHTML = "";
    askBtn.disabled = true;

    try {
      const askRes = await fetch("/brain/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = askRes.ok ? await askRes.json() : {};
      answerEl.className = "answer-section";
      answerEl.textContent = data.answer || (askRes.ok ? "" : "답변을 불러오지 못했습니다.");

      const searchRes = await fetch("/brain/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question }),
      });
      const searchData = searchRes.ok ? await searchRes.json() : [];

      if (Array.isArray(searchData)) {
        searchData.forEach(addResult);
      }
    } catch (err) {
      answerEl.className = "answer-section";
      answerEl.textContent = "오류: " + (err.message || "네트워크 오류");
      const errDiv = document.createElement("div");
      errDiv.className = "error";
      errDiv.textContent = err.message || "검색 결과를 불러오지 못했습니다.";
      resultsEl.appendChild(errDiv);
    } finally {
      askBtn.disabled = false;
    }
  });
})();
