import { useState } from 'react';
import Search from './components/Search';
import Timeline from './components/Timeline';
import FamilyGraph from './components/FamilyGraph';
import Upload from './components/Upload';
import Ask from './components/Ask';
import Memo from './components/Memo';

type TabId = 'upload' | 'search' | 'ask' | 'memo' | 'timeline' | 'family';

const TABS: { id: TabId; label: string }[] = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'search', label: '검색' },
  { id: 'ask', label: '질문' },
  { id: 'memo', label: '메모' },
  { id: 'family', label: 'Family' },
  { id: 'upload', label: '업로드' },
];

/**
 * Full UI: Web + Mobile. 탭으로 업로드 / 검색 / Timeline / Family Graph 전환.
 * 모바일: 사진 input에 capture → 카메라·갤러리·파일 선택 가능.
 */
function App() {
  const [activeTab, setActiveTab] = useState<TabId>('upload');

  return (
    <div className="app max-w-7xl mx-auto px-4 py-4 pb-12 sm:p-6">
      <h1 className="text-2xl font-bold mb-1">Personal + Family AI</h1>
      <p className="text-zinc-400 text-sm mb-4">업로드 · 검색 · 질문 · Timeline · Family Graph (Web + 모바일)</p>

      <nav
        className="flex gap-1 mb-6 border-b border-zinc-700 pb-2 overflow-x-auto"
        role="tablist"
        aria-label="메인 메뉴"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            tabIndex={activeTab === id ? 0 : -1}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'upload' && <Upload />}
        {activeTab === 'search' && <Search />}
        {activeTab === 'ask' && <Ask />}
        {activeTab === 'memo' && <Memo />}
        {activeTab === 'timeline' && <Timeline />}
        {activeTab === 'family' && <FamilyGraph />}
      </div>
    </div>
  );
}

export default App;
