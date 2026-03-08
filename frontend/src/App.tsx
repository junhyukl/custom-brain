import { useState, useEffect } from 'react';
import Search from './components/Search';
import Timeline from './components/Timeline';
import FamilyGraph from './components/FamilyGraph';
import Upload from './components/Upload';
import Ask from './components/Ask';
import Memo from './components/Memo';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import { useAuth } from './hooks/useAuth';

type TabId = 'upload' | 'search' | 'ask' | 'memo' | 'timeline' | 'family' | 'users';

const BASE_TABS: { id: TabId; label: string }[] = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'search', label: '검색' },
  { id: 'ask', label: '질문' },
  { id: 'memo', label: '메모' },
  { id: 'family', label: 'Family' },
  { id: 'upload', label: '업로드' },
];

type MainTabId = Exclude<TabId, 'users'>;
const TAB_PANELS: Record<MainTabId, React.ReactNode> = {
  upload: <Upload />,
  search: <Search />,
  ask: <Ask />,
  memo: <Memo />,
  timeline: <Timeline />,
  family: <FamilyGraph />,
};

/**
 * Full UI: Web + Mobile. 탭으로 업로드 / 검색 / Timeline / Family Graph 전환.
 * 로그인 후 이용 가능 (로컬 시드: junhyukl@gmail.com / 1234AB!).
 */
function App() {
  const { isLoggedIn, currentUser, handleLoggedIn, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('upload');

  const isAdmin = currentUser?.role === 'admin';
  const tabs = isAdmin
    ? [...BASE_TABS, { id: 'users' as const, label: '사용자 관리' }]
    : BASE_TABS;

  useEffect(() => {
    if (!isAdmin && activeTab === 'users') {
      setActiveTab('upload');
    }
  }, [isAdmin, activeTab]);

  if (!isLoggedIn) {
    return <Login onLoggedIn={handleLoggedIn} />;
  }

  return (
    <div className="app max-w-7xl mx-auto px-4 py-4 pb-12 sm:p-6">
      <header className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Personal + Family AI</h1>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          로그아웃
        </button>
      </header>
      <p className="text-zinc-400 text-sm mb-4">
        업로드 · 검색 · 질문 · Timeline · Family Graph (Web + 모바일)
      </p>

      <nav
        className="flex gap-1 mb-6 border-b border-zinc-700 pb-2 overflow-x-auto"
        role="tablist"
        aria-label="메인 메뉴"
      >
        {tabs.map(({ id, label }) => (
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
        {activeTab === 'users' ? (
          <UserManagement currentUserId={currentUser?.id} />
        ) : (
          TAB_PANELS[activeTab as MainTabId]
        )}
      </div>
    </div>
  );
}

export default App;
