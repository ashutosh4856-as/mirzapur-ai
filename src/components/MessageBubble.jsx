import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { getImageUrl } from '../services/apiRouter';

export default function MessageBubble({ message, isStreaming }) {
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (bubbleRef.current) {
      bubbleRef.current.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
    }
  }, [message.content]);

  const handleOptionClick = (opt, grid) => {
    grid.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('sel'));
    document.getElementById('user-input-main').value = opt;
    document.getElementById('user-input-main').focus();
  };

  const renderContent = () => {
    const text = message.content;

    // Options format check
    const optMatch = text.match(/\[QUESTION\]:\s*(.+?)\n\[OPTIONS\]:\s*(.+)/s);
    if (optMatch) {
      const before = text.slice(0, text.indexOf('[QUESTION]:')).trim();
      return (
        <div>
          {before && <div className="bubble-content" dangerouslySetInnerHTML={{ __html: marked.parse(before) }} />}
          <div style={{ margin: '10px 0 4px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 10 }}>
              ❓ {optMatch[1].trim()}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {optMatch[2].split('|').map(opt => opt.trim()).map((opt, i) => (
                <button key={i}
                  onClick={() => { document.getElementById('user-input-main').value = opt; document.getElementById('user-input-main').focus(); }}
                  style={{
                    padding: '8px 15px', border: '1.5px solid var(--orange)',
                    background: 'var(--orange-pale)', color: 'var(--orange)',
                    borderRadius: 22, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s'
                  }}
                  onMouseOver={e => { e.target.style.background = 'var(--orange)'; e.target.style.color = 'white'; }}
                  onMouseOut={e => { e.target.style.background = 'var(--orange-pale)'; e.target.style.color = 'var(--orange)'; }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Image format check
    const imgMatch = text.match(/\[IMAGE\]:\s*(.+)/);
    const cleanText = text.replace(/\[IMAGE\]:.+/g, '').trim();

    return (
      <div>
        <div
          ref={bubbleRef}
          className="bubble-content"
          dangerouslySetInnerHTML={{
            __html: processCodeBlocks(marked.parse(cleanText)) +
              (isStreaming ? '<span class="cursor"></span>' : '')
          }}
        />
        {imgMatch && <GeneratedImage prompt={imgMatch[1].trim()} />}
      </div>
    );
  };

  const processCodeBlocks = (html) => {
    return html.replace(
      /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
      (match, lang, code) => {
        const decoded = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        const isHtml = lang === 'html';
        return `
          <div class="code-block" data-code="${encodeURIComponent(decoded)}" data-lang="${lang}">
            <div class="code-header">
              <span class="code-lang">${lang.toUpperCase()}</span>
              <div class="code-btns">
                <button class="cbtn cbtn-copy" onclick="copyCodeBlock(this)">📋 Copy</button>
                <button class="cbtn cbtn-dl" onclick="dlCodeBlock(this)">⬇️ Download</button>
                ${isHtml ? '<button class="cbtn cbtn-prev" onclick="prevCodeBlock(this)">👁️ Preview</button>' : ''}
              </div>
            </div>
            <pre><code class="language-${lang}">${code}</code></pre>
          </div>`;
      }
    );
  };

  if (message.role === 'user') {
    return (
      <div style={{ display: 'flex', gap: 10, flexDirection: 'row-reverse', animation: 'msgIn 0.25s ease' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gray-200)', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 3 }}>तु</div>
        <div style={{ maxWidth: 'calc(100% - 46px)', padding: '13px 16px', borderRadius: 'var(--radius)', borderTopRightRadius: 5, background: 'var(--orange)', color: 'white', fontSize: 14, lineHeight: 1.72, wordBreak: 'break-word' }}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, animation: 'msgIn 0.25s ease' }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--orange)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 3 }}>AI</div>
      <div style={{ maxWidth: 'calc(100% - 46px)', padding: '13px 16px', borderRadius: 'var(--radius)', borderTopLeftRadius: 5, background: 'white', border: '1px solid var(--gray-200)', fontSize: 14, lineHeight: 1.72, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', wordBreak: 'break-word' }}>
        {renderContent()}
      </div>
    </div>
  );
}

function GeneratedImage({ prompt }) {
  const url = getImageUrl(prompt);
  return (
    <div style={{ marginTop: 10 }}>
      <img
        src={url}
        alt={prompt}
        style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid var(--gray-200)', display: 'block' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      <a href={url} download="mirzapur-ai-image.jpg" target="_blank" style={{
        display: 'inline-block', marginTop: 6, padding: '5px 12px',
        background: 'var(--orange)', color: 'white', borderRadius: 8,
        fontSize: 12, fontWeight: 600, textDecoration: 'none'
      }}>⬇️ Download Image</a>
    </div>
  );
}
