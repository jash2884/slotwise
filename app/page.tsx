"use client";
import { useEffect, useState, useRef } from "react";
import { ArrowUpRight, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Compass, LayoutGrid, Plus, Search, ShieldCheck, Sparkles, Video, X, Loader2, Globe, SlidersHorizontal, LogOut, BookOpen } from "lucide-react";
type Mentor = {
    id: string;
    name: string;
    title: string;
    specialty: string;
    bio: string;
    color: string;
    demo: number;
    owned: number;
};
type Slot = {
    id: string;
    mentor_id: string;
    starts_at: number;
    ends_at: number;
    taken: number;
};
type Booking = {
    id: string;
    name: string;
    topic: string;
    starts_at: number;
    ends_at: number;
    status: string;
    mentor_name: string;
    mentor_title: string;
    color: string;
    hosting: number;
};
type Data = {
    user: {
        name: string;
        email: string;
    } | null;
    mentors: Mentor[];
    slots: Slot[];
    appointments: Booking[];
};
const empty: Data = { user: null, mentors: [], slots: [], appointments: [] };
const categories = ["All mentors", "Software engineering", "Career guidance", "Design", "Data & AI"];
const initials = (name: string) => name.split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase();
export default function Home() {
    const requestKey = useRef('');
    const [data, setData] = useState<Data>(empty), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [tab, setTab] = useState("explore"), [category, setCategory] = useState("All mentors"), [search, setSearch] = useState(""), [zone, setZone] = useState("Asia/Kolkata"), [selected, setSelected] = useState<Mentor | null>(null), [day, setDay] = useState(""), [slotId, setSlotId] = useState(""), [topic, setTopic] = useState(""), [help, setHelp] = useState(false), [filter, setFilter] = useState("upcoming"), [availability, setAvailability] = useState("");
    const [profile, setProfile] = useState({ name: "", title: "", specialty: "Software engineering", bio: "" });
    async function load() { try {
        const r = await fetch('/api/state', { cache: 'no-store' });
        const j = await r.json() as Data & {
            error?: string;
        };
        if (!r.ok)
            throw Error(j.error);
        setData(j);
        return j as Data;
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "Could not load your workspace.");
        return null;
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { setZone(Intl.DateTimeFormat().resolvedOptions().timeZone); void load(); }, []);
    useEffect(() => { if (!selected && !help)
        return; const before = document.activeElement as HTMLElement | null; const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) {
        setSelected(null);
        setHelp(false);
    } if (e.key === 'Tab') {
        const els = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] button:not(:disabled),[role="dialog"] a[href],[role="dialog"] input,[role="dialog"] select,[role="dialog"] textarea'));
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
        }
    } }; const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; document.addEventListener('keydown', onKey); return () => { document.body.style.overflow = old; document.removeEventListener('keydown', onKey); before?.focus(); }; }, [!!selected, help, busy]);
    const mine = data.mentors.find(m => m.owned);
    useEffect(() => { if (mine)
        setProfile({ name: mine.name, title: mine.title, specialty: mine.specialty, bio: mine.bio }); }, [mine?.id]);
    const fmt = (n: number, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en', { ...opts, timeZone: zone }).format(n);
    const dateKey = (n: number) => fmt(n, { year: 'numeric', month: '2-digit', day: '2-digit' });
    const upcoming = data.appointments.filter(b => b.status === 'confirmed' && b.starts_at > Date.now()).sort((a, b) => a.starts_at - b.starts_at);
    const next = upcoming[0];
    const shown = data.mentors.filter(m => (category === 'All mentors' || category === m.specialty) && `${m.name} ${m.title} ${m.bio}`.toLowerCase().includes(search.toLowerCase()));
    const available = data.slots.filter(s => s.mentor_id === selected?.id && !s.taken);
    const days = Array.from(new Set(available.map(s => dateKey(s.starts_at))));
    const selectedSlot = data.slots.find(s => s.id === slotId);
    const filteredBookings = data.appointments.filter(b => filter === 'cancelled' ? b.status === 'cancelled' : filter === 'past' ? b.status === 'confirmed' && b.starts_at <= Date.now() : b.status === 'confirmed' && b.starts_at > Date.now()).sort((a, b) => filter === 'upcoming' ? a.starts_at - b.starts_at : b.starts_at - a.starts_at);
    const zones = Array.from(new Set([zone, 'Asia/Kolkata', 'UTC', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Singapore', 'Australia/Sydney']));
    async function mutate(url: string, body?: unknown, method = 'POST', headers?: Record<string, string>) { setBusy(true); setError(''); setNotice(''); try {
        const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
        const j = await r.json() as {
            error?: string;
        };
        if (!r.ok)
            throw Error(j.error ?? 'Please try again.');
        await load();
        return true;
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Please try again.');
        return false;
    }
    finally {
        setBusy(false);
    } }
    function choose(m: Mentor) { requestKey.current = crypto.randomUUID(); setSelected(m); setDay(''); setSlotId(''); setTopic(''); setError(''); }
    async function book() { if (!slotId || topic.trim().length < 5)
        return; if (await mutate('/api/bookings', { slotId, topic }, 'POST', { 'Idempotency-Key': requestKey.current })) {
        setSelected(null);
        setTab('sessions');
        setNotice('Your session is booked. You can find the details below.');
    } }
    function exportCalendar(b: Booking) {
        const stamp = (n: number) => new Date(n).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
        const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
        const text = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Slotwise//Sessions//EN', 'BEGIN:VEVENT', `UID:${b.id}@slotwise`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(b.starts_at)}`, `DTEND:${stamp(b.ends_at)}`, `SUMMARY:${escape('Mentoring with ' + b.mentor_name)}`, `DESCRIPTION:${escape(b.topic + ' · Arrange a meeting link directly with your mentor.')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
        const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'slotwise-session.ics';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return <div className="app-shell">
 <aside className="sidebar"><a className="brand" href="/" aria-label="Slotwise home"><span className="brand-icon">s</span>slotwise<span className="brand-dot">.</span></a><div className="workspace-label">YOUR WORKSPACE</div><nav aria-label="Main navigation">{[{ id: 'explore', label: 'Explore mentors', icon: Compass }, { id: 'sessions', label: 'My sessions', icon: CalendarDays }, { id: 'studio', label: 'Mentor studio', icon: LayoutGrid }].map(n => <button key={n.id} onClick={() => { setTab(n.id); setError(''); setNotice(''); }} className={tab === n.id ? 'nav-item active' : 'nav-item'}><n.icon size={19}/>{n.label}{n.id === 'sessions' && upcoming.length > 0 && <span className="nav-count">{upcoming.length}</span>}</button>)}</nav><div className="sidebar-note"><div className="note-spark"><Sparkles size={19}/></div><strong>A little guidance.<br />A big next step.</strong><p>Your next breakthrough starts with a conversation.</p><button onClick={() => setHelp(true)}>How it works <ArrowUpRight size={16}/></button></div><div className="sidebar-bottom"><button className="help-link" onClick={() => setHelp(true)}><BookOpen size={17}/> Quick guide</button>{data.user ? <div className="user"><span className="avatar tiny mint">{initials(data.user.name)}</span><span><strong>{data.user.name}</strong><small>Personal workspace</small></span><a title="Sign out" aria-label="Sign out" href="/signout-with-chatgpt?return_to=%2F" target="_top"><LogOut size={16}/></a></div> : <a className="btn primary signin" href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in to get started <ArrowRight size={15}/></a>}</div></aside>
 <div className="main-shell"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span><strong>{tab === 'explore' ? 'Explore mentors' : tab === 'sessions' ? 'My sessions' : 'Mentor studio'}</strong></div><div className="top-right"><span className="timezone"><Globe size={14}/>{zone.replaceAll('_', ' ')}</span><span className="avatar tiny mint">{data.user ? initials(data.user.name) : 'SW'}</span></div></header>
 <main><div className="page-heading"><div><div className="eyebrow">MAKE ROOM FOR WHAT’S NEXT</div><h1>{tab === 'explore' ? 'Good conversations. Real progress.' : tab === 'sessions' ? 'Your next steps, scheduled.' : 'Share what you know.'}</h1><p>{tab === 'explore' ? 'Find a mentor, pick a time, and move forward with a little clarity.' : tab === 'sessions' ? 'A little time set aside for your growth. All your sessions live here.' : 'Create your mentor profile and make time for someone’s next chapter.'}</p></div>{tab === 'explore' && <button className="btn outline" onClick={() => setHelp(true)}>How it works <ArrowUpRight size={16}/></button>}</div>
 {error && <div className="alert error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={16}/></button></div>}{notice && <div className="alert success" role="status"><Check size={18}/>{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16}/></button></div>}
 {tab === 'explore' && <><section className="hero"><div className="hero-copy"><div className="hero-pill"><span /> YOUR NEXT CHAPTER STARTS HERE</div><h2>Big ambitions.<br />Meet your next step.</h2><p>A fresh perspective can change everything.<br />Make time for a focused, 1:1 mentor session.</p><button className="btn dark" onClick={() => document.getElementById('mentors')?.scrollIntoView({ behavior: 'smooth' })}>Find your mentor <ArrowRight size={17}/></button><div className="hero-footer"><ShieldCheck size={15}/> Clear availability. Thoughtful connections.</div></div><div className="hero-art" aria-hidden="true"><span className="orbit one"/><span className="orbit two"/><span className="star">✳</span><div className="art-calendar"><div className="art-cal-head"><span>YOUR NEXT STEP</span><CalendarDays size={17}/></div><div className="art-cal-date">A little time.<br /><em>A lot of possibility.</em></div><div className="mini-week">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((v, i) => <span key={i}>{v}</span>)}</div><div className="mini-days">{Array.from({ length: 14 }, (_, i) => <span key={i} className={i === 9 ? 'chosen' : ''}>{i + 1}</span>)}</div><div className="art-session"><span className="art-check"><Check size={16}/></span><div><strong>Time for your growth</strong><small>30 minutes · One meaningful conversation</small></div></div></div><div className="floating-note"><Sparkles size={18}/><span>A fresh perspective<br /><strong>is closer than you think.</strong></span></div></div></section>
 <section className="overview"><div><span className="icon-box"><CalendarDays size={21}/></span><div><small>Upcoming sessions</small><strong>{upcoming.length.toString().padStart(2, '0')}<span>{upcoming.length === 1 ? 'conversation ahead' : 'conversations ahead'}</span></strong></div></div><div><span className="icon-box peach"><Compass size={21}/></span><div><small>Mentors to discover</small><strong>{data.mentors.length.toString().padStart(2, '0')}<span>different perspectives</span></strong></div></div><div><span className="icon-box lilac"><Clock size={21}/></span><div><small>A little focus goes a long way</small><strong>30 min<span>just for your next step</span></strong></div></div></section>
 <div className="explore-layout"><section id="mentors" className="mentors-section"><div className="section-heading"><div><h2>Find your kind of guidance <span>{shown.length}</span></h2><p>People to learn from. Perspectives to grow with.</p></div></div><div className="search"><Search size={18}/><input aria-label="Search mentors" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, skill, or interest…"/><SlidersHorizontal size={17}/></div><div className="chips" aria-label="Mentor specialty">{categories.map(c => <button className={category === c ? 'chip selected' : 'chip'} key={c} onClick={() => setCategory(c)}>{c === 'Software engineering' ? 'Engineering' : c}</button>)}</div>
 {loading ? <div className="empty"><Loader2 className="spin"/><h3>Finding your next conversation…</h3></div> : shown.length ? <div className="mentor-grid">{shown.map(m => { const count = data.slots.filter(s => s.mentor_id === m.id && !s.taken).length; return <article className="mentor-card" key={m.id}><div className="mentor-top"><span className={'avatar ' + m.color}>{initials(m.name)}</span><span className="specialty">{m.specialty === 'Software engineering' ? 'Engineering' : m.specialty}</span></div><h3>{m.name}{!!m.demo && <span className="demo-label">DEMO</span>}</h3><p className="mentor-title">{m.title}</p><p className="mentor-bio">{m.bio}</p><div className="mentor-meta"><Clock size={14}/>30 min<span>·</span>1:1 session</div><div className="mentor-card-bottom"><span className={count ? 'availability' : 'muted'}>{count ? <><i />{count} open slots</> : 'No open slots yet'}</span><button className="btn card-btn" disabled={!count} onClick={() => choose(m)}>{m.owned ? 'View slots' : 'View availability'}<ArrowUpRight size={15}/></button></div></article>; })}</div> : <div className="empty"><Compass size={30}/><h3>{data.mentors.length ? 'No mentors match your search' : 'Start with a little inspiration'}</h3><p>{data.mentors.length ? 'Try a different name or specialty.' : 'Load sample mentors to explore booking, or create your own mentor profile.'}</p>{!data.mentors.length && <button className="btn primary" disabled={busy || !data.user} onClick={async () => { if (await mutate('/api/demo'))
            setNotice('Sample mentors added. These are fictional demo profiles; bookings do not arrange real meetings.'); }}>{busy ? <Loader2 className="spin" size={16}/> : <Plus size={16}/>}Load sample mentors</button>}{!data.user && <a href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in to try booking</a>}</div>}
 </section><aside className="right-column"><section className="next-session"><div className="section-label"><span className="live-dot"/> UP NEXT</div>{next ? <><div className="next-date">{fmt(next.starts_at, { month: 'short', day: 'numeric' })}<span>{fmt(next.starts_at, { weekday: 'long' })}</span></div><h3>{next.mentor_name}</h3><p>{next.topic}</p><div className="next-time"><Clock size={15}/>{fmt(next.starts_at, { hour: 'numeric', minute: '2-digit' })} · 30 min</div><button className="btn outline full" onClick={() => setTab('sessions')}>View session <ArrowUpRight size={15}/></button></> : <><div className="empty-calendar"><CalendarDays size={32}/><span>+</span></div><h3>Your next step awaits</h3><p>Book a conversation and give your ambitions a spot on the calendar.</p><button className="text-btn" onClick={() => document.getElementById('mentors')?.scrollIntoView({ behavior: 'smooth' })}>Explore mentors <ArrowRight size={15}/></button></>}</section><section className="tip-card"><Sparkles size={21}/><span>A LITTLE PREPARATION</span><h3>Bring a question.<br />Leave with direction.</h3><p>Share what you’re working toward when you book. A little context makes a better conversation.</p></section><div className="demo-disclaimer">Sample mentors are fictional. Slotwise saves bookings; meeting links are arranged separately.</div></aside></div></>}
 {tab === 'sessions' && <><div className="session-controls"><div className="chips">{['upcoming', 'past', 'cancelled'].map(f => <button key={f} className={filter === f ? 'chip selected' : 'chip'} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div><label className="zone-select"><Globe size={15}/><select aria-label="Display timezone" value={zone} onChange={e => setZone(e.target.value)}>{zones.map(z => <option key={z}>{z}</option>)}</select></label></div>{filteredBookings.length ? <div className="booking-list">{filteredBookings.map(b => <article className="booking-card" key={b.id}><div className={'booking-date ' + b.color}><strong>{fmt(b.starts_at, { day: 'numeric' })}</strong><span>{fmt(b.starts_at, { month: 'short' })}</span></div><div className="booking-main"><div className="booking-badges"><span className={'status ' + b.status}>{b.status === 'confirmed' && b.starts_at <= Date.now() ? 'Past session' : b.status}</span>{!!b.hosting && <span className="specialty">You’re hosting</span>}</div><h3>{b.hosting ? 'Session with ' + b.name : b.mentor_name}</h3><p>{b.topic}</p><div className="mentor-meta"><Clock size={14}/>{fmt(b.starts_at, { weekday: 'short', hour: 'numeric', minute: '2-digit' })} – {fmt(b.ends_at, { hour: 'numeric', minute: '2-digit' })}<span>·</span>30 min</div></div><div className="booking-actions">{b.status === 'confirmed' && b.starts_at > Date.now() && <><button className="btn outline" onClick={() => exportCalendar(b)}><CalendarDays size={15}/>Add to calendar</button><button className="text-btn danger" disabled={busy} onClick={async () => { if (window.confirm('Cancel this session? The slot will become available again.'))
        if (await mutate('/api/bookings', { id: b.id }, 'PATCH'))
            setNotice('Session cancelled. The slot is available again.'); }}>Cancel session</button></>}<small>Meeting link arranged separately</small></div></article>)}</div> : <div className="empty large"><CalendarDays size={36}/><h3>No {filter} sessions yet</h3><p>{filter === 'upcoming' ? 'Your next good conversation could be one booking away.' : 'Your session history will appear here.'}</p>{filter === 'upcoming' && <button className="btn primary" onClick={() => setTab('explore')}>Find a mentor <ArrowRight size={16}/></button>}</div>}</>}
 {tab === 'studio' && <div className="studio-grid"><section className="panel"><div className="section-heading"><div><h2>Your mentor profile</h2><p>Let people know how you can help.</p></div><span className="icon-box"><Compass size={21}/></span></div><form onSubmit={async (e) => { e.preventDefault(); if (await mutate('/api/profile', profile))
        setNotice('Your mentor profile is saved. Add a few slots to become bookable.'); }}><label>Full name<input required minLength={2} maxLength={60} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Your name"/></label><label>Professional headline<input required minLength={3} maxLength={100} value={profile.title} onChange={e => setProfile({ ...profile, title: e.target.value })} placeholder="Software engineer · Backend systems"/></label><label>Area of guidance<select value={profile.specialty} onChange={e => setProfile({ ...profile, specialty: e.target.value })}>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label>How can you help?<textarea required minLength={20} maxLength={600} rows={4} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell future mentees what you can work through together…"/></label><button className="btn primary" disabled={busy || !data.user}>{busy ? <Loader2 size={16} className="spin"/> : <Check size={16}/>}Save profile</button>{!data.user && <p className="muted">Sign in to create your profile.</p>}</form></section><section className="panel"><div className="section-heading"><div><h2>Make a little time</h2><p>Add 30-minute slots to your availability.</p></div><span className="icon-box lilac"><CalendarDays size={21}/></span></div><form onSubmit={async (e) => { e.preventDefault(); if (await mutate('/api/slots', { startsAt: new Date(availability).getTime() })) {
        setAvailability('');
        setNotice('Your slot is live and ready to book.');
    } }}><label>Date & time<input required type="datetime-local" step="1800" value={availability} onChange={e => setAvailability(e.target.value)}/></label><p className="field-help">Enter time in your device timezone: {typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : zone}. Choose :00 or :30, up to 90 days ahead.</p><button className="btn primary" disabled={busy || !mine}><Plus size={16}/>Add availability</button></form><div className="availability-list">{mine ? data.slots.filter(s => s.mentor_id === mine.id).map(s => <div key={s.id}><span><strong>{fmt(s.starts_at, { month: 'short', day: 'numeric' })}</strong><small>{fmt(s.starts_at, { hour: 'numeric', minute: '2-digit' })} · {zone}</small></span>{s.taken ? <span className="status confirmed">Booked</span> : <button className="icon-button" aria-label="Remove slot" disabled={busy} onClick={() => mutate('/api/slots', { id: s.id }, 'DELETE')}><X size={16}/></button>}</div>) : <div className="empty small"><p>Save your mentor profile first, then add your available times.</p></div>}</div></section></div>}
 <footer><span><span className="footer-mark">s</span> A little time. A meaningful next step.</span><span>Built for better conversations.</span></footer>
 </main></div>
 {selected && <div className="modal-backdrop" onClick={() => !busy && setSelected(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="booking-title" onClick={e => e.stopPropagation()}><button autoFocus className="modal-close" aria-label="Close booking" disabled={busy} onClick={() => setSelected(null)}><X size={21}/></button><div className="modal-mentor"><span className={'avatar ' + selected.color}>{initials(selected.name)}</span><div><div className="eyebrow">MAKE YOUR NEXT MOVE</div><h2 id="booking-title">Meet with {selected.name.split(' ')[0]}</h2><p>{selected.title}</p></div></div>{!!selected.demo && <div className="demo-banner">Sample mentor · This booking is a product demo, not a real appointment.</div>}<div className="booking-info"><span><Clock size={15}/>30-minute session</span><span><Video size={15}/>Meeting link arranged separately</span></div><label className="zone-select modal-zone"><Globe size={16}/><select aria-label="Booking timezone" value={zone} onChange={e => { setZone(e.target.value); setDay(''); setSlotId(''); }}>{zones.map(z => <option key={z}>{z}</option>)}</select></label><h3>Pick a day</h3><div className="day-picker">{days.map(d => { const s = available.find(s => dateKey(s.starts_at) === d)!; return <button key={d} className={day === d ? 'day selected' : 'day'} onClick={() => { setDay(d); setSlotId(''); }}><small>{fmt(s.starts_at, { weekday: 'short' })}</small><strong>{fmt(s.starts_at, { day: 'numeric' })}</strong><small>{fmt(s.starts_at, { month: 'short' })}</small></button>; })}</div>{!days.length && <p className="muted">No open slots right now. Check back soon.</p>}{day && <><h3>Choose a time</h3><div className="time-picker">{available.filter(s => dateKey(s.starts_at) === day).map(s => <button className={slotId === s.id ? 'time selected' : 'time'} key={s.id} onClick={() => setSlotId(s.id)}>{fmt(s.starts_at, { hour: 'numeric', minute: '2-digit' })}</button>)}</div></>}<label className="topic-label">What would you like to work on?<textarea value={topic} onChange={e => setTopic(e.target.value)} minLength={5} maxLength={500} rows={3} placeholder="A specific question, a project, or your next career step…"/></label>{error && <p className="modal-error" role="alert">{error}</p>}{selectedSlot && <p className="booking-summary">{fmt(selectedSlot.starts_at, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {zone}</p>}{data.user ? <button className="btn primary full" disabled={busy || !slotId || topic.trim().length < 5 || !!selected.owned} onClick={book}>{busy ? <Loader2 size={17} className="spin"/> : <Check size={17}/>} {selected.owned ? 'This is your own availability' : 'Confirm session'}</button> : <a className="btn primary full" target="_top" href="/signin-with-chatgpt?return_to=%2F">Sign in to book <ArrowRight size={16}/></a>}<p className="modal-footnote">Your slot is reserved once the booking is confirmed.</p></section></div>}
 {help && <div className="modal-backdrop" onClick={() => setHelp(false)}><section className="modal guide" role="dialog" aria-modal="true" aria-labelledby="guide-title" onClick={e => e.stopPropagation()}><button autoFocus className="modal-close" aria-label="Close guide" onClick={() => setHelp(false)}><X size={21}/></button><span className="icon-box"><Sparkles size={25}/></span><h2 id="guide-title">A good next step starts here.</h2><p>Slotwise makes it easy to set aside time for a focused conversation.</p>{[['01', 'Find your person', 'Browse mentors by specialty and find a perspective that fits your next step.'], ['02', 'Make a little time', 'Choose an available 30-minute slot. Times are shown in your selected timezone.'], ['03', 'Bring your question', 'Add a topic, confirm your booking, and save it to your calendar. Arrange your meeting link directly with your mentor.']].map(([n, t, d]) => <div className="guide-step" key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></div>)}<div className="demo-banner">Trying it out? Load sample mentors on Explore. They are fictional profiles for testing the booking experience.</div><button className="btn primary full" onClick={() => { setHelp(false); setTab('explore'); }}>Find your next conversation <ArrowRight size={16}/></button></section></div>}
 </div>;
}
