import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut, saveChat, getUserChats, deleteChat as fbDeleteChat } from './firebase';
import { streamAI, KEYS } from './services/apiRouter';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import InputBar from './components/InputBar';
import { marked } from 'marked';

// Global code block handlers
window.copyCodeBlock = (btn) => {
  const code = decodeURIComponent(btn.closest('.code-block').dataset.code);
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy', 2000);
  });
};
window.dlCodeBlock = (btn) => {
  const w = btn.closest('.code-block');
  const code = decodeURIComponent(w.dataset.code);
  const lang = w.dataset.lang;
  const exts = { html:'html',javascript:'js',js:'js',python:'py',css:'css',java:'java',cpp:'cpp',c:'c',json:'json',sql:'sql',bash:'sh',typescript:'ts' };
  const ext = exts[lang.toLowerCase()] || 'txt';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
  a.download = `mirzapur-${lang}.${ext}`; a.click();
};
window.prevCodeBlock = (btn) => {
  const w = btn.closest('.code-block');
  let f = w.querySelector('.preview-frame');
  if (f) { f.remove(); btn.textContent = '👁️ Preview'; }
  else {
    f = document.createElement('iframe');
    f.className = 'preview-frame';
    f.sandbox = 'allow-scripts';
    f.srcdoc = decodeURIComponent(w.dataset.code);
    f.style.cssText = 'width:100%;height:280px;border:none;border-top:1px solid var(--gray-200)';
    w.appendChild(f);
    btn.textContent = '❌ Close';
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState(() => JSON.parse(localStorage.getItem('mzp_chats') || '{}'));
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [currentModel, setCurrentModel] = useState('Gemini');
  const [showSettings, setShowSettings] = useState(false);
  const [keys, setKeys] = useState({ g: localStorage.getItem('mzp_g') || '', gr: localStorage.getItem('mzp_gr') || '', or: localStorage.getItem('mzp_or') || '' });
  const chatEndRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userChats = await getUserChats(u.uid);
          const chatMap = {};
          userChats.forEach(c => { chatMap[c.id] = c; });
          setChats(prev => ({ ...prev, ...chatMap }));
        } catch {}
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveChatsLocal = (updated) => {
    localStorage.setItem('mzp_chats', JSON.stringify(updated));
    setChats(updated);
  };

  const newChat = () => {
    const id = 'c' + Date.now();
    const chat = { title: 'नई Chat', messages: [], t: Date.now() };
    const updated = { [id]: chat, ...chats };
    saveChatsLocal(updated);
    setCurrentChatId(id);
    setMessages([]);
    setSidebarOpen(false);
  };

  const loadChat = (id) => {
    setCurrentChatId(id);
    setMessages(chats[id]?.messages || []);
  };

  const deleteChat = async (id) => {
    if (user) { try { await fbDeleteChat(id); } catch {} }
    const updated = { ...chats };
    delete updated[id];
    saveChatsLocal(updated);
    if (currentChatId === id) { setCurrentChatId(null); setMessages([]); }
  };

  const handleSend = async (text) => {
    if (streaming) return;
    let chatId = currentChatId;
    if (!chatId) {
      chatId = 'c' + Date.now();
      setCurrentChatId(chatId);
    }

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    const title = text.slice(0, 38) + (text.length > 38 ? '…' : '');
    const updatedChat = { title: chats[chatId]?.title === 'नई Chat' ? title : (chats[chatId]?.title || title), messages: updatedMessages, t: Date.now() };
    const updatedChats = { ...chats, [chatId]: updatedChat };
    saveChatsLocal(updatedChats);

    setStreaming(true);
    let fullText = '';
    const streamMsg = { role: 'assistant', content: '', isStreaming: true };
    setMessages(prev => [...prev, streamMsg]);

    try {
      const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      for await (const chunk of streamAI(apiMessages, (name) => {
        setCurrentModel(name.charAt(0).toUpperCase() + name.slice(1));
      })) {
        fullText += chunk;
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: fullText } : m));
      }
    } catch (e) {
      fullText = '❌ Error: ' + e.message;
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: fullText, isStreaming: false } : m));
    }

    const finalMsg = { role: 'assistant', content: fullText, isStreaming: false };
    const finalMessages = [...updatedMessages, finalMsg];
    setMessages(finalMessages);
    const finalChat = { ...updatedChat, messages: finalMessages };
    const finalChats = { ...updatedChats, [chatId]: finalChat };
    saveChatsLocal(finalChats);

    if (user) {
      try { await saveChat(user.uid, finalChat); } catch {}
    }

    setStreaming(false);
  };

  const saveSettings = () => {
    if (keys.g) { localStorage.setItem('mzp_g', keys.g); KEYS.gemini = keys.g; }
    if (keys.gr) { localStorage.setItem('mzp_gr', keys.gr); KEYS.groq = keys.gr; }
    if (keys.or) { localStorage.setItem('mzp_or', keys.or); KEYS.openrouter = keys.or; }
    setShowSettings(false);
  };

  const showWelcome = messages.length === 0;

  return (
    <div style={{ display: 'flex', height: '100dvh', width: '100%', overflow: 'hidden' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={newChat}
        onLoadChat={loadChat}
        onDeleteChat={deleteChat}
        user={user}
        onLogin={signInWithGoogle}
        onLogout={logOut}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        {/* TOPBAR */}
        <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', borderBottom: '1px solid var(--gray-200)', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 7, borderRadius: 9, display: 'flex', flexDirection: 'column', gap: 4.5 }}>
            {[1,2,3].map(i => <span key={i} style={{ display: 'block', width: 19, height: 2, background: 'var(--gray-800)', borderRadius: 2 }} />)}
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--orange)', flex: 1 }}>मिर्ज़ापुर AI</div>
          <div style={{ fontSize: 11, background: 'var(--orange-pale)', color: 'var(--orange)', padding: '4px 9px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(255,107,0,0.2)' }}>
            {currentModel}
          </div>
        </div>

        {/* CHAT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 10px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {showWelcome ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16, padding: '40px 16px', minHeight: '60vh' }}>
              <div style={{ fontSize: 52 }}>🔥</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--black)' }}>
                मिर्ज़ापुर <span style={{ color: 'var(--orange)' }}>AI</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.65, maxWidth: 300 }}>
                नमस्ते! मैं तुम्हारा AI दोस्त हूं।<br />Hindi, Hinglish या English — कुछ भी पूछो!
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} isStreaming={msg.isStreaming && i === messages.length - 1} />
            ))
          )}

          {/* Typing indicator */}
          {streaming && messages[messages.length - 1]?.content === '' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--orange)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>AI</div>
              <div style={{ display: 'flex', gap: 5, padding: '14px 16px', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', borderTopLeftRadius: 5 }}>
                {[0, 200, 400].map(delay => (
                  <span key={delay} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)', display: 'block', animation: `tdot 1.3s ${delay}ms infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <InputBar onSend={handleSend} disabled={streaming} />
      </div>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: 'white', width: '100%', borderRadius: '22px 22px 0 0', padding: '22px 20px 44px', maxHeight: '88dvh', overflowY: 'auto' }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              ⚙️ API Keys
              <button onClick={() => setShowSettings(false)} style={{ background: 'var(--gray-100)', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>
            {[
              { label: '🔑 Gemini API Key', key: 'g', placeholder: 'AIza...' },
              { label: '🔑 Groq API Key', key: 'gr', placeholder: 'gsk_...' },
              { label: '🔑 OpenRouter API Key', key: 'or', placeholder: 'sk-or-...' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', margin: '14px 0 5px', display: 'block' }}>{label}</label>
                <input
                  type="password"
                  placeholder={placeholder}
                  value={keys[key]}
                  onChange={e => setKeys(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '11px 13px', border: '1.5px solid var(--gray-200)', borderRadius: 11, fontSize: 14, fontFamily: 'monospace', outline: 'none' }}
                />
              </div>
            ))}
            <button onClick={saveSettings} style={{ width: '100%', padding: 13, background: 'var(--orange)', color: 'white', border: 'none', borderRadius: 13, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 18 }}>
              💾 Save करो
            </button>
          </div>
        </div>
      )}

      {/* Global CSS for code blocks */}
      <style>{`
        .code-block { margin: 10px 0; border-radius: 12px; overflow: hidden; border: 1px solid var(--gray-200); background: white; }
        .code-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 13px; background: var(--gray-100); }
        .code-lang { font-size: 11.5px; font-weight: 700; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.5px; }
        .code-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .cbtn { padding: 4px 10px; border: none; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .cbtn-copy { background: var(--gray-200); color: var(--gray-800); }
        .cbtn-dl { background: var(--orange); color: white; }
        .cbtn-prev { background: #3B82F6; color: white; }
        .code-block pre { margin: 0; padding: 14px; overflow-x: auto; font-size: 13px; max-height: 320px; }
        .code-block code { font-family: 'Courier New', monospace; }
        @keyframes micPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes tdot { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-5px);opacity:1} }
      `}</style>
    </div>
  );
}
