import Search from './components/Search';
import Timeline from './components/Timeline';
import FamilyGraph from './components/FamilyGraph';
import Upload from './components/Upload';

/**
 * Full UI: 업로드 → 검색 → Timeline → Family Graph.
 * Backend: /brain/upload/photo, /brain/upload/document, /brain/* search/timeline/family
 */
function App() {
  return (
    <div className="app max-w-7xl mx-auto px-4 py-4 pb-12 sm:p-6">
      <h1 className="text-2xl font-bold mb-1">Personal + Family AI</h1>
      <p className="text-zinc-400 text-sm mb-6">업로드 · 검색 · Timeline · Family Graph</p>

      <Upload />
      <Search />
      <Timeline />
      <FamilyGraph />
    </div>
  );
}

export default App;
