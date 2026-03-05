import Search from './components/Search';
import Timeline from './components/Timeline';
import FamilyGraph from './components/FamilyGraph';

/**
 * Full UI: 검색 → 결과 → Timeline → 가족 그래프 한 페이지에 통합.
 * Backend: /brain/photos|documents|memory/search, /brain/timeline, /brain/family/tree
 */
function App() {
  return (
    <div className="app max-w-7xl mx-auto p-4 pb-12">
      <h1 className="text-2xl font-bold mb-1">Personal + Family AI</h1>
      <p className="text-zinc-400 text-sm mb-6">검색 · Timeline · Family Graph</p>

      <Search />
      <Timeline />
      <FamilyGraph />
    </div>
  );
}

export default App;
