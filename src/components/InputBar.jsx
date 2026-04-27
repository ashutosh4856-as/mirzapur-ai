import { useRef, useState } from 'react';

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [micOn, setMicOn] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const chips = [
    { label: '🐍 Python Code', prompt: 'एक Python calculator बनाओ' },
    { label: '🌐 HTML Page', prompt: 'एक सुंदर HTML webpage बनाओ' },
    { label: '📖 कहानी', prompt: 'मेरे लिए एक रोमांचक कहानी लिखो' },
  ];
  const moreChips = [
    { label: '🎨 Image बनाओ', prompt: 'एक dragon की image generate करो' },
    { label: '✍️ Novel', prompt: 'एक novel लिखना है, Chinese wuxia style में' },
    { label: '💡 JS सीखो', prompt: 'JavaScript क्या है? सिखाओ' },
    { label: '🧠 मन की बात', prompt: 'मुझे life में motivation चाहिए' },
    { label: '📄 Resume', prompt: 'एक resume template बनाओ HTML में' },
  ];

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoGrow = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
  };

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Chrome browser use करो Speech के लिए।'); return;
    }
    if (micOn) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = 'hi-IN';
    recog.interimResults = true;
    recog.onstart = () => setMicOn(true);
    recog.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setText(transcript);
    };
    recog.onend = () => {
      setMicOn(false);
      const val = textareaRef.current?.value?.trim();
      if (val) { onSend(val); setText(''); }
    };
    recog.onerror = () => setMicOn(false);
    recognitionRef.current = recog;
    recog.start();
  };

  return (
    <div style={{ padding: '10px 14px 18px', background: 'var(--bg)' }}>
      {/* Input Box */}
      <div style={{
        background: 'white', borderRadius: 20,
        border: '1px solid var(--gray-200)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        padding: '10px 10px 10px 16px',
        display: 'flex', alignItems: 'flex-end', gap: 8,
      }}>
        <textarea
          id="user-input-main"
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={e => { setText(e.target.value); autoGrow(e.target); }}
          onKeyDown={handleKey}
          placeholder="यहाँ लिखो..."
          style={{
            flex: 1, border: 'none', background: 'none',
            fontSize: 15, fontFamily: 'inherit', resize: 'none',
            outline: 'none', maxHeight: 130, lineHeight: 1.55,
            color: 'var(--black)', padding: '3px 0'
          }}
        />

        {/* MIC */}
        <button
          onClick={toggleMic}
          style={{
            width: 36, height: 36, border: 'none',
            background: micOn ? '#FEE2E2' : 'none',
            color: micOn ? '#EF4444' : 'var(--gray-400)',
            borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
            animation: micOn ? 'micPulse 1s infinite' : 'none'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </button>

        {/* SEND — Arrow UP */}
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          style={{
            width: 36, height: 36, border: 'none',
            background: disabled || !text.trim() ? 'var(--gray-200)' : 'var(--black)',
            color: 'white', borderRadius: '50%', cursor: disabled || !text.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
            boxShadow: disabled || !text.trim() ? 'none' : '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        </button>
      </div>

      {/* Quick Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9, paddingLeft: 2 }}>
        {chips.map((c, i) => (
          <button key={i} onClick={() => onSend(c.prompt)} style={{
            padding: '7px 13px', border: '1.5px solid var(--gray-200)',
            borderRadius: 20, fontSize: 12, color: 'var(--gray-800)',
            background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
            transition: 'all 0.2s'
          }}>
            {c.label}
          </button>
        ))}
        <button onClick={() => setShowMore(!showMore)} style={{
          padding: '7px 13px', border: '1.5px dashed var(--gray-300)',
          borderRadius: 20, fontSize: 12, color: 'var(--gray-600)',
          background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500
        }}>
          {showMore ? 'कम दिखाएं ▴' : 'अधिक दिखाएं ▾'}
        </button>
        {showMore && moreChips.map((c, i) => (
          <button key={i} onClick={() => onSend(c.prompt)} style={{
            padding: '7px 13px', border: '1.5px solid var(--gray-200)',
            borderRadius: 20, fontSize: 12, color: 'var(--gray-800)',
            background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500
          }}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
