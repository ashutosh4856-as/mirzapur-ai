import { useState } from 'react';

export default function Sidebar({ isOpen, onClose, chats, currentChatId, onNewChat, onLoadChat, onDeleteChat, user, onLogin, onLogout, onOpenSettings }) {

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 199,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: 280,
        height: '100dvh',
        background: '#fff',
        borderRight: '1px solid var(--gray-200)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: isOpen ? 0 : -280,
        top: 0,
        zIndex: 200,
        transition: 'left 0.28s cubic-bezier(.4,0,.2,1)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.08)'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--gray-100)' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--orange)', marginBottom: 13 }}>
            🔥 मिर्ज़ापुर AI
          </div>

          {/* User */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '8px 10px', background: 'var(--orange-pale)', borderRadius: 10 }}>
              <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-600)' }}>Signed in</div>
              </div>
            </div>
          ) : (
            <button onClick={onLogin} style={{
              width: '100%', padding: '9px', background: 'var(--gray-100)',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
              color: 'var(--gray-800)', cursor: 'pointer', marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7
            }}>
              <img src="https://www.google.com/favicon.ico" width="16" alt="G" />
              Google से Login करो
            </button>
          )}

          <button onClick={onNewChat} style={{
            width: '100%', padding: 11, background: 'var(--orange)', color: 'white',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7
          }}>
            + नई Chat
          </button>
        </div>

        {/* Chat History */}
        <div style={{ padding: '14px 16px 6px', fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.9px' }}>
          Chat History
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {Object.entries(chats).sort((a,b) => b[1].t - a[1].t).map(([id, chat]) => (
            <div
              key={id}
              onClick={() => { onLoadChat(id); onClose(); }}
              style={{
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13, color: id === currentChatId ? 'var(--orange)' : 'var(--gray-800)',
                background: id === currentChatId ? 'var(--orange-pale)' : 'transparent',
                fontWeight: id === currentChatId ? 600 : 400,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 8, marginBottom: 2, transition: 'background 0.15s'
              }}
              className="history-item"
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                💬 {chat.title}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteChat(id); }}
                style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: 15, padding: '2px 5px', borderRadius: 5 }}
              >🗑</button>
            </div>
          ))}
          {Object.keys(chats).length === 0 && (
            <div style={{ padding: '20px 12px', fontSize: 13, color: 'var(--gray-400)', textAlign: 'center' }}>
              अभी कोई chat नहीं है।<br/>ऊपर "नई Chat" दबाओ!
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--gray-100)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onOpenSettings} style={{
            width: '100%', padding: 9, background: 'var(--gray-100)', border: 'none',
            borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', cursor: 'pointer'
          }}>⚙️ Settings / API Keys</button>

          {user && (
            <button onClick={onLogout} style={{
              width: '100%', padding: 8, background: 'none', border: '1px solid var(--gray-200)',
              borderRadius: 10, fontSize: 13, color: 'var(--gray-600)', cursor: 'pointer'
            }}>Sign Out</button>
          )}

          <div style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center' }}>
            Made with ❤️ by A.S. Rajput
          </div>
        </div>
      </div>
    </>
  );
}
