import { useState, useRef, useEffect } from "react";
import  api  from "./api.js";

// ─── Mock data ──────────────────────────────────────────────────────────────
// Replace with real API call: GET /api/contacts  (returns users registered in your app)
const REGISTERED_CONTACTS = [
    { id: "c1", name: "Aryan Sharma",   email: "aryan.sharma@gmail.com",   initials: "AS", color: "#6C63FF", online: true  },
    { id: "c2", name: "Priya Mehta",    email: "priya.mehta@gmail.com",    initials: "PM", color: "#10B981", online: false },
    { id: "c3", name: "Rohan Das",      email: "rohan.das@gmail.com",      initials: "RD", color: "#F59E0B", online: true  },
    { id: "c4", name: "Sneha Iyer",     email: "sneha.iyer@gmail.com",     initials: "SI", color: "#EC4899", online: false },
    { id: "c5", name: "Vikram Patel",   email: "vikram.patel@gmail.com",   initials: "VP", color: "#3B82F6", online: true  },
    { id: "c6", name: "Ananya Gupta",   email: "ananya.gupta@gmail.com",   initials: "AG", color: "#8B5CF6", online: false },
];

const MY_PROFILE = { id: "me", name: "Karan Singh", email: "karan.singh@gmail.com", avatar: "KS", color: "#6C63FF" };

const timeNow = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── Avatar component ────────────────────────────────────────────────────────
const Avatar = ({ initials, color, size = 38, online = false, bgColor = "#16161d" }) => (
    <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
            width: size, height: size, borderRadius: "50%", background: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.35, fontWeight: 600, color: "#fff",
            letterSpacing: "0.5px", fontFamily: "'DM Mono', monospace", userSelect: "none",
        }}>
            {initials}
        </div>
        {online && (
            <span style={{
                position: "absolute", bottom: 1, right: 1,
                width: size > 32 ? 10 : 8, height: size > 32 ? 10 : 8,
                borderRadius: "50%", background: "#22c55e",
                border: `2px solid ${bgColor}`,
            }} />
        )}
    </div>
);

// ─── Main export ─────────────────────────────────────────────────────────────
export default function ChatHomePage() {
    const [dark, setDark]             = useState(true);
    const [chats, setChats]           = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [input, setInput]           = useState("");
    const [sidebarSearch, setSidebarSearch] = useState("");

    // dialog states
    const [showLogout, setShowLogout]   = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const [contactSearch, setContactSearch] = useState("");

    const messagesEndRef  = useRef(null);
    const inputRef        = useRef(null);
    const contactInputRef = useRef(null);

    // ── theme ─────────────────────────────────────────────────────────────────
    const t = {
        bg:           dark ? "#0f0f13" : "#f2f2f7",
        bgSidebar:    dark ? "#16161d" : "#ffffff",
        bgChat:       dark ? "#0f0f13" : "#f2f2f7",
        bgBubbleMe:   "#6C63FF",
        bgBubbleThem: dark ? "#1e1e2a" : "#e4e4ee",
        bgInput:      dark ? "#1e1e2a" : "#ffffff",
        bgHover:      dark ? "#1e1e2a" : "#f0f0f8",
        bgActive:     dark ? "#252538" : "#eaeaf8",
        bgModal:      dark ? "#1a1a26" : "#ffffff",
        border:       dark ? "#2a2a3a" : "#e0e0ea",
        text:         dark ? "#e8e8f2" : "#1a1a2e",
        textSec:      dark ? "#8888aa" : "#6868a0",
        textMuted:    dark ? "#55557a" : "#a0a0c0",
        searchBg:     dark ? "#1e1e2a" : "#f0f0f8",
        accent:       "#6C63FF",
        accentSoft:   dark ? "#2a2845" : "#ebebff",
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chats, activeChat]);

    const activeChatData = chats.find(c => c.id === activeChat);

    // ── contact search logic ──────────────────────────────────────────────────
    const q = contactSearch.trim().toLowerCase();
    const filteredContacts = q
        ? REGISTERED_CONTACTS.filter(c =>
            c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
        )
        : REGISTERED_CONTACTS;

    // detect if user typed an email that doesn't exist in the registry
    const looksLikeEmail   = q.includes("@");
    const exactEmailFound  = REGISTERED_CONTACTS.some(c => c.email.toLowerCase() === q);
    const showNotRegistered = looksLikeEmail && !exactEmailFound && q.length > 5;

    // sidebar only filters existing chats
    const filteredChats = sidebarSearch.trim()
        ? chats.filter(c => c.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
        : chats;

    // ── handlers ──────────────────────────────────────────────────────────────
    const handleStartChat = (contact) => {
        const existing = chats.find(c => c.contactId === contact.id);
        if (existing) {
            setActiveChat(existing.id);
        } else {
            const newChat = {
                id: `chat-${contact.id}`,
                contactId: contact.id,
                name: contact.name,
                email: contact.email,
                initials: contact.initials,
                color: contact.color,
                online: contact.online,
                messages: [],
                lastMessage: "",
                lastTime: "",
            };
            setChats(prev => [newChat, ...prev]);
            setActiveChat(newChat.id);
        }
        closeNewChat();
    };

    const handleSend = () => {
        if (!input.trim() || !activeChat) return;
        const msg = { id: Date.now(), text: input.trim(), sender: "me", time: timeNow() };
        setChats(prev =>
            prev.map(c =>
                c.id === activeChat
                    ? { ...c, messages: [...c.messages, msg], lastMessage: input.trim(), lastTime: timeNow() }
                    : c
            )
        );
        setInput("");
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleKeyDown = e => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const openNewChat = () => {
        setShowNewChat(true);
        setTimeout(() => contactInputRef.current?.focus(), 80);
    };

    const closeNewChat = () => {
        setShowNewChat(false);
        setContactSearch("");
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", height: "100vh", background: t.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif", overflow: "hidden", color: t.text, transition: "background 0.2s" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${t.border};border-radius:4px}
        input:focus,textarea:focus{outline:none}
        button{cursor:pointer;border:none;background:none;font-family:inherit}
      `}</style>

            {/* ═══════════════════ SIDEBAR ═══════════════════ */}
            <div style={{ width: 300, minWidth: 300, background: t.bgSidebar, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", transition: "background 0.2s" }}>

                {/* Top bar */}
                <div style={{ padding: "14px 14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6C63FF,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="white" opacity="0.9"/></svg>
                        </div>
                        <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" }}>Vibe Chat</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setDark(d => !d)} title="Toggle theme"
                                style={{ width: 32, height: 32, borderRadius: 8, background: t.searchBg, display: "flex", alignItems: "center", justifyContent: "center", color: t.textSec }}>
                            {dark
                                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                            }
                        </button>
                        <button onClick={openNewChat} title="New Chat"
                                style={{ width: 32, height: 32, borderRadius: 8, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 300, lineHeight: 1 }}>
                            +
                        </button>
                    </div>
                </div>

                {/* Sidebar search — only filters existing chats */}
                <div style={{ padding: "10px 12px 6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: t.searchBg, borderRadius: 10, padding: "8px 12px", border: `1px solid ${t.border}` }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Search chats…"
                               style={{ flex: 1, background: "none", border: "none", fontSize: 13, color: t.text, fontFamily: "inherit" }} />
                    </div>
                </div>

                {/* Chat list */}
                <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
                    {filteredChats.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "44px 20px", color: t.textMuted, fontSize: 13 }}>
                            {chats.length === 0 ? (
                                <>
                                    <div style={{ fontSize: 34, marginBottom: 10 }}>💬</div>
                                    <div style={{ fontWeight: 500, color: t.textSec, marginBottom: 5 }}>No chats yet</div>
                                    <div style={{ lineHeight: 1.6 }}>Tap <strong style={{ color: t.accent }}>+</strong> to find a registered contact and start chatting</div>
                                </>
                            ) : "No chats match that search"}
                        </div>
                    ) : filteredChats.map(chat => (
                        <div key={chat.id} onClick={() => setActiveChat(chat.id)}
                             style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 10px", borderRadius: 12, cursor: "pointer", marginBottom: 2, transition: "background 0.12s", background: activeChat === chat.id ? t.bgActive : "transparent" }}
                             onMouseEnter={e => { if (activeChat !== chat.id) e.currentTarget.style.background = t.bgHover; }}
                             onMouseLeave={e => { if (activeChat !== chat.id) e.currentTarget.style.background = "transparent"; }}>
                            <Avatar initials={chat.initials} color={chat.color} size={42} online={chat.online} bgColor={t.bgSidebar} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                    <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{chat.name}</span>
                                    <span style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}>{chat.lastTime}</span>
                                </div>
                                <div style={{ fontSize: 12, color: t.textSec, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                                    {chat.lastMessage || <em style={{ color: t.textMuted }}>Start a conversation</em>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Profile + logout */}
                <div style={{ padding: "12px", borderTop: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 10, background: t.bgSidebar }}>
                    <Avatar initials={MY_PROFILE.avatar} color={MY_PROFILE.color} size={36} online bgColor={t.bgSidebar} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{MY_PROFILE.name}</div>
                        <div style={{ fontSize: 11, color: "#22c55e" }}>Online</div>
                    </div>
                    <button onClick={() => setShowLogout(true)} title="Logout"
                            style={{ width: 32, height: 32, borderRadius: 8, background: dark ? "#2a1a1a" : "#fdecea", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </button>
                </div>
            </div>

            {/* ═══════════════════ CHAT AREA ═══════════════════ */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: t.bgChat, transition: "background 0.2s", minWidth: 0 }}>
                {activeChatData ? (
                    <>
                        {/* Header */}
                        <div style={{ height: 64, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, background: t.bgSidebar, flexShrink: 0, transition: "background 0.2s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <Avatar initials={activeChatData.initials} color={activeChatData.color} size={40} online={activeChatData.online} bgColor={t.bgSidebar} />
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{activeChatData.name}</div>
                                    <div style={{ fontSize: 11, color: activeChatData.online ? "#22c55e" : t.textMuted }}>
                                        {activeChatData.online ? "Online" : "Offline"}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                {[
                                    { title: "Voice Call", icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.44 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l1.21-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/> },
                                    { title: "Video Call", icon: <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></> },
                                    { title: "Search",     icon: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></> },
                                    { title: "More",       icon: <><circle cx="12" cy="5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/></> },
                                ].map(({ title, icon }) => (
                                    <button key={title} title={title}
                                            style={{ width: 36, height: 36, borderRadius: 9, background: t.searchBg, display: "flex", alignItems: "center", justifyContent: "center", color: t.textSec }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                            {activeChatData.messages.length === 0 ? (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: t.textMuted }}>
                                    <Avatar initials={activeChatData.initials} color={activeChatData.color} size={62} bgColor={t.bgChat} />
                                    <div style={{ fontSize: 15, fontWeight: 500, color: t.textSec, marginTop: 4 }}>{activeChatData.name}</div>
                                    <div style={{ fontSize: 12, color: t.textMuted }}>{activeChatData.email}</div>
                                    <div style={{ marginTop: 6, fontSize: 13 }}>Say hi to start the conversation!</div>
                                </div>
                            ) : activeChatData.messages.map(msg => {
                                const isMe = msg.sender === "me";
                                return (
                                    <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}>
                                        {!isMe && <Avatar initials={activeChatData.initials} color={activeChatData.color} size={28} bgColor={t.bgChat} />}
                                        <div style={{ maxWidth: "65%" }}>
                                            <div style={{ padding: "9px 14px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isMe ? t.bgBubbleMe : t.bgBubbleThem, color: isMe ? "#fff" : t.text, fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" }}>
                                                {msg.text}
                                            </div>
                                            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 3, textAlign: isMe ? "right" : "left" }}>{msg.time}</div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div style={{ padding: "14px 20px", borderTop: `1px solid ${t.border}`, background: t.bgSidebar, flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 14, padding: "8px 8px 8px 14px" }}>
                                <button style={{ color: t.textMuted, display: "flex" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                                </button>
                                <button style={{ color: t.textMuted, display: "flex" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                </button>
                                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                                       placeholder={`Message ${activeChatData.name}…`}
                                       style={{ flex: 1, background: "none", border: "none", fontSize: 14, color: t.text, fontFamily: "inherit" }} />
                                <button onClick={handleSend} disabled={!input.trim()}
                                        style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s", background: input.trim() ? t.accent : (dark ? "#252535" : "#e0e0ee"), color: input.trim() ? "#fff" : t.textMuted }}>
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: t.textMuted }}>
                        <div style={{ width: 80, height: 80, borderRadius: 24, background: dark ? "#1e1e2a" : "#e6e6f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5" opacity="0.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 19, fontWeight: 600, color: t.textSec, marginBottom: 6 }}>Your messages</div>
                            <div style={{ fontSize: 14, maxWidth: 260, lineHeight: 1.6 }}>
                                Select a chat or tap <strong style={{ color: t.accent }}>+</strong> to find a registered contact
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════ NEW CHAT DIALOG ═══════════════════ */}
            {showNewChat && (
                <div onClick={closeNewChat}
                     style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.62)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
                    <div onClick={e => e.stopPropagation()}
                         style={{ background: t.bgModal, borderRadius: 20, width: 430, maxHeight: "72vh", display: "flex", flexDirection: "column", border: `1px solid ${t.border}`, boxShadow: "0 28px 80px rgba(0,0,0,0.5)", overflow: "hidden" }}>

                        {/* Dialog header */}
                        <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 3 }}>New Conversation</div>
                                    <div style={{ fontSize: 12, color: t.textSec }}>Search registered contacts by name or Gmail address</div>
                                </div>
                                <button onClick={closeNewChat}
                                        style={{ width: 30, height: 30, borderRadius: 8, background: t.searchBg, display: "flex", alignItems: "center", justifyContent: "center", color: t.textSec, fontSize: 15, marginTop: 2 }}>
                                    ✕
                                </button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, background: t.searchBg, borderRadius: 11, padding: "9px 13px", border: `1px solid ${t.border}` }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input ref={contactInputRef} value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                                       placeholder="Name or email@gmail.com…"
                                       style={{ flex: 1, background: "none", border: "none", fontSize: 14, color: t.text, fontFamily: "inherit" }} />
                                {contactSearch && (
                                    <button onClick={() => setContactSearch("")} style={{ color: t.textMuted, fontSize: 14, display: "flex" }}>✕</button>
                                )}
                            </div>
                        </div>

                        {/* Results list */}
                        <div style={{ overflowY: "auto", padding: "10px 10px" }}>

                            {/* ── Not-registered banner ── */}
                            {showNotRegistered && (
                                <div style={{ margin: "4px 4px 10px", borderRadius: 14, background: dark ? "#1f1624" : "#fff6f6", border: `1px solid ${dark ? "#3e2048" : "#fccaca"}`, padding: "16px 16px" }}>
                                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: dark ? "#30182e" : "#ffe4e4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: dark ? "#f87171" : "#dc2626", marginBottom: 5 }}>Not registered on Vibe Chat</div>
                                            <div style={{ fontSize: 12, color: t.textSec, lineHeight: 1.65, marginBottom: 10 }}>
                                                <strong style={{ color: t.text }}>{contactSearch}</strong> hasn't created an account yet. You can only chat with people who are registered.
                                            </div>
                                            <div style={{ background: dark ? "#28162a" : "#fff", borderRadius: 10, border: `1px solid ${dark ? "#3e2048" : "#fccaca"}`, padding: "10px 12px" }}>
                                                <div style={{ fontSize: 11, fontWeight: 600, color: t.textSec, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>What can you do?</div>
                                                <div style={{ fontSize: 12, color: t.textSec, lineHeight: 1.7 }}>
                                                    Ask them to sign up at <strong style={{ color: t.accent }}>vibechat.app/register</strong> using their Gmail account. Once they join, they'll appear here and you can start chatting.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Empty search results (non-email) ── */}
                            {filteredContacts.length === 0 && !showNotRegistered && (
                                <div style={{ textAlign: "center", padding: "36px 20px", color: t.textMuted, fontSize: 13 }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                                    <div style={{ fontWeight: 500, color: t.textSec, marginBottom: 4 }}>No registered users found</div>
                                    <div style={{ lineHeight: 1.6 }}>Try a different name, or enter their full Gmail address to check if they're registered</div>
                                </div>
                            )}

                            {/* ── Contact rows ── */}
                            {filteredContacts.map(contact => {
                                const alreadyOpen = chats.some(c => c.contactId === contact.id);
                                return (
                                    <div key={contact.id} onClick={() => handleStartChat(contact)}
                                         style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 12, cursor: "pointer", marginBottom: 2, transition: "background 0.12s" }}
                                         onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
                                         onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <Avatar initials={contact.initials} color={contact.color} size={44} online={contact.online} bgColor={t.bgModal} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                                                <span style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{contact.name}</span>
                                                {alreadyOpen && (
                                                    <span style={{ fontSize: 10, fontWeight: 500, background: t.accentSoft, color: t.accent, padding: "2px 8px", borderRadius: 20 }}>Active</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: t.textSec }}>{contact.email}</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: contact.online ? "#22c55e" : t.textMuted }} />
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════ LOGOUT DIALOG ═══════════════════ */}
            {showLogout && (
                <div onClick={() => setShowLogout(false)}
                     style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.62)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
                    <div onClick={e => e.stopPropagation()}
                         style={{ background: t.bgModal, borderRadius: 20, padding: "28px 32px", width: 320, border: `1px solid ${t.border}`, boxShadow: "0 28px 80px rgba(0,0,0,0.5)" }}>
                        <div style={{ width: 50, height: 50, borderRadius: 14, background: dark ? "#2a1a1a" : "#fdecea", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        </div>
                        <div style={{ textAlign: "center", marginBottom: 22 }}>
                            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Log out?</div>
                            <div style={{ fontSize: 13, color: t.textSec, lineHeight: 1.6 }}>You'll need to sign in again to access your chats.</div>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setShowLogout(false)}
                                    style={{ flex: 1, padding: "11px", borderRadius: 11, background: t.searchBg, color: t.text, fontSize: 14, fontWeight: 500, border: `1px solid ${t.border}` }}>
                                Cancel
                            </button>
                            <button onClick={() => { api.post(`/auth/logout`,); setShowLogout(false); }}
                                    style={{ flex: 1, padding: "11px", borderRadius: 11, background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 500 }}>
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}