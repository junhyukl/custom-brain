import { useState, useEffect } from 'react';
import axios from 'axios';
import { toErrorMessage } from '../utils/request';

type Message = { role: string; content: string };

export default function Ask() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemory = async () => {
    try {
      const res = await axios.get<{ messages: Message[] }>('/brain/memory');
      setMessages(res.data.messages ?? []);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await axios.post<{ answer: string }>('/brain/ask', {
        question: question.trim(),
      });
      setAnswer(res.data.answer ?? '');
      setQuestion('');
      await fetchMemory();
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-4 border-b border-zinc-800">
      <h2 className="text-xl font-bold mb-2">질문</h2>
      <p className="text-zinc-400 text-sm mb-3">
        질문하면 <strong className="text-zinc-300">메모·사진·문서</strong>를 검색한 뒤 그 내용을 바탕으로 답변합니다. 메모 탭에 저장한 내용도 여기서 활용됩니다.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="질문을 입력하세요..."
          className="flex-1 min-w-[200px] border border-zinc-600 rounded-lg px-3 py-2 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500"
        >
          {loading ? '처리 중...' : '질문'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-3" role="alert">
          {error}
        </p>
      )}

      {answer !== null && answer !== '' && (
        <div className="mb-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700">
          <p className="text-zinc-300 text-sm font-medium mb-1">답변</p>
          <p className="text-zinc-100 whitespace-pre-wrap">{answer}</p>
        </div>
      )}

      {messages.length > 0 && (
        <details className="mt-4">
          <summary className="text-zinc-400 text-sm cursor-pointer hover:text-zinc-300">
            최근 대화 ({messages.length}턴)
          </summary>
          <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto">
            {messages.map((m, i) => (
              <li
                key={i}
                className={`text-sm p-2 rounded ${
                  m.role === 'user'
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'bg-zinc-800/50 text-zinc-300 border-l-2 border-blue-500 pl-3'
                }`}
              >
                <span className="font-medium text-zinc-500 mr-2">
                  {m.role === 'user' ? 'Q' : 'A'}:
                </span>
                <span className="whitespace-pre-wrap">{m.content}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
