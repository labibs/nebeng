// src/components/chat/ChatHeader.jsx
import { useNavigate } from 'react-router-dom';

export default function ChatHeader({ recipient }) {
  const navigate = useNavigate();

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 flex items-center gap-3">
        <div className="avatar online">
          <div className="w-12 rounded-full ring ring-emerald-500 ring-offset-base-100 ring-offset-2">
            <img src={recipient.imageUrl} alt={recipient.name} />
          </div>
        </div>
        <div>
          <h2 className="font-bold text-lg">{recipient.name}</h2>
          <p className="text-sm opacity-70">Online</p>
        </div>
      </div>
    </div>
  );
}