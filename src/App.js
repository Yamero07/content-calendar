import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const STATUSES = ["Draft", "Doing", "Done"];
const STATUS_COLORS = { Draft: "#a0a0a0", Doing: "#f0a500", Done: "#4caf87" };
const PLATFORMS = [
  { name: "Facebook", color: "#1877F2", emoji: "📘" },
  { name: "TikTok", color: "#010101", emoji: "🎵" },
  { name: "Instagram", color: "#E1306C", emoji: "📸" },
  { name: "YouTube", color: "#FF0000", emoji: "▶️" },
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const today = new Date();

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }
function isoKey(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function getWeekDates() {
  const t = new Date(today), day = t.getDay(), dates = [];
  for (let i = 0; i < 7; i++) { const d = new Date(t); d.setDate(t.getDate()-day+i); dates.push(d); }
  return dates;
}

const USER_ID = "shared"; // ข้อมูลรวมกันทุกคน หรือเปลี่ยนเป็น username ถ้าอยากแยก

export default function App() {
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [data, setData] = useState({});
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ idea: "", status: "Draft", notes: "", platform: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load from Firestore
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "calendars", USER_ID);
        const snap = await getDoc(ref);
        if (snap.exists()) setData(snap.data().entries || {});
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  // Save to Firestore
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const ref = doc(db, "calendars", USER_ID);
        await setDoc(ref, { entries: data });
      } catch (e) { console.error(e); }
      setTimeout(() => setSaving(false), 800);
    }, 500);
    return () => clearTimeout(timer);
  }, [data]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  const prevMonth = () => { if (month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); setSelected(null); };
  const nextMonth = () => { if (month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); setSelected(null); };

  const openDay = (d) => {
    const key = isoKey(year, month, d);
    setSelected(key);
    setEditForm({ ...(data[key] || { idea:"", status:"Draft", notes:"" }) });
  };

  const save = () => {
    if (!selected) return;
    if (!editForm.idea.trim()) { clear(); return; }
    setData(prev => ({ ...prev, [selected]: { ...editForm } }));
    setSelected(null);
  };

  const clear = () => {
    if (!selected) return;
    setData(prev => { const n={...prev}; delete n[selected]; return n; });
    setSelected(null);
  };

  const weekDates = getWeekDates();
  const weekStats = { Draft:0, Doing:0, Done:0 };
  weekDates.forEach(d => {
    const k = isoKey(d.getFullYear(), d.getMonth(), d.getDate());
    if (data[k]?.status) weekStats[data[k].status]++;
  });
  const weekTotal = Object.values(weekStats).reduce((a,b)=>a+b,0);

  let monthTotal=0, monthDone=0;
  for (let d=1; d<=daysInMonth; d++) {
    const k = isoKey(year,month,d);
    if (data[k]?.idea) { monthTotal++; if(data[k].status==="Done") monthDone++; }
  }

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);

  const todayKey = isoKey(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedDate = selected ? new Date(selected+"T00:00:00") : null;

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#f9f8f6", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
      <div style={{ textAlign:"center", color:"#aaa" }}>
        <div style={{ fontSize:24, marginBottom:8 }}>✦</div>
        <div style={{ fontSize:13 }}>Loading your calendar…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#f9f8f6", fontFamily:"'Inter',sans-serif", color:"#1a1a1a", padding:"24px 16px" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.5px", margin:0 }}>✦ Content Calendar</h1>
            <p style={{ fontSize:12, color:"#888", marginTop:4 }}>Your private creative workspace</p>
          </div>
          <div style={{ fontSize:11, color: saving ? "#4caf87" : "#ccc", transition:"color 0.3s" }}>
            {saving ? "✓ Saved" : "Auto-save on"}
          </div>
        </div>

        <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
          <div style={{ flex:"1 1 520px", background:"#fff", borderRadius:16, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <button onClick={prevMonth} style={navBtn}>‹</button>
              <span style={{ fontWeight:600, fontSize:15 }}>{MONTHS[month]} {year}</span>
              <button onClick={nextMonth} style={navBtn}>›</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign:"center", fontSize:11, color:"#aaa", fontWeight:500, padding:"4px 0" }}>{d}</div>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
              {cells.map((d,i) => {
                if (!d) return <div key={`e${i}`} />;
                const key = isoKey(year,month,d);
                const entry = data[key];
                const isToday = key===todayKey, isSelected = key===selected;
                return (
                  <div key={key} onClick={()=>openDay(d)} style={{
                    borderRadius:10, padding:"6px 4px", cursor:"pointer", minHeight:52,
                    background: isSelected?"#1a1a1a": isToday?"#f0ede8":"#fafafa",
                    border: isToday&&!isSelected?"1.5px solid #ddd":"1.5px solid transparent",
                    transition:"background 0.15s",
                  }}>
                    <div style={{ fontSize:11, fontWeight:600, color:isSelected?"#fff":isToday?"#1a1a1a":"#444", textAlign:"center" }}>{d}</div>
                    {entry?.idea && (
                      <div style={{ marginTop:3, textAlign:"center" }}>
                        <span style={{ display:"inline-block", fontSize:9, fontWeight:600, background:isSelected?"rgba(255,255,255,0.18)":STATUS_COLORS[entry.status]+"22", color:isSelected?"#fff":STATUS_COLORS[entry.status], borderRadius:4, padding:"1px 5px" }}>{entry.status}</span>
                        <div style={{ fontSize:9, color:isSelected?"rgba(255,255,255,0.8)":"#888", marginTop:2, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", padding:"0 2px" }}>{entry.idea.slice(0,14)}{entry.idea.length>14?"…":""}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ flex:"0 0 220px", display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ background:"#fff", borderRadius:16, padding:18, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#888", letterSpacing:"0.05em", marginBottom:12, textTransform:"uppercase" }}>This Week</div>
              <div style={{ fontSize:28, fontWeight:800, lineHeight:1 }}>{weekStats.Done}<span style={{ fontSize:13, fontWeight:400, color:"#aaa" }}> / {weekTotal}</span></div>
              <div style={{ fontSize:11, color:"#888", marginTop:2 }}>pieces published</div>
              <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:7 }}>
                {STATUSES.map(s => (
                  <div key={s} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:STATUS_COLORS[s] }} />
                      <span style={{ fontSize:12, color:"#555" }}>{s}</span>
                    </div>
                    <span style={{ fontSize:12, fontWeight:600 }}>{weekStats[s]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:"#fff", borderRadius:16, padding:18, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#888", letterSpacing:"0.05em", marginBottom:10, textTransform:"uppercase" }}>This Month</div>
              <div style={{ fontSize:22, fontWeight:700 }}>{monthDone}<span style={{ fontSize:12, fontWeight:400, color:"#aaa" }}> done</span></div>
              <div style={{ fontSize:11, color:"#aaa", marginTop:2 }}>{monthTotal} content planned</div>
              {monthTotal>0 && (
                <div style={{ marginTop:10, background:"#f0ede8", borderRadius:999, height:6, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:999, background:"#4caf87", width:`${(monthDone/monthTotal)*100}%`, transition:"width 0.3s" }} />
                </div>
              )}
            </div>

            <div style={{ background:"#fff", borderRadius:16, padding:18, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#888", letterSpacing:"0.05em", marginBottom:8, textTransform:"uppercase" }}>☁️ Firebase</div>
              <div style={{ fontSize:11, color:"#666", lineHeight:1.6 }}>ข้อมูล sync real-time ทุกคนเห็นพร้อมกัน</div>
            </div>
          </div>
        </div>

        {selected && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:16 }}
            onClick={e=>{ if(e.target===e.currentTarget) setSelected(null); }}>
            <div style={{ background:"#fff", borderRadius:20, padding:26, width:"100%", maxWidth:400, boxShadow:"0 8px 32px rgba(0,0,0,0.12)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>
                    {selectedDate ? `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` : ""}
                  </div>
                  <div style={{ fontSize:11, color:"#aaa", marginTop:2 }}>Content entry</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#aaa" }}>×</button>
              </div>

              <label style={labelStyle}>💡 Content Idea</label>
              <input value={editForm.idea} onChange={e=>setEditForm(f=>({...f,idea:e.target.value}))}
                placeholder="What's the content about?"
                style={{ ...inputStyle, marginBottom:14 }} />

              <label style={labelStyle}>📌 Status</label>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                {STATUSES.map(s=>(
                  <button key={s} onClick={()=>setEditForm(f=>({...f,status:s}))} style={{
                    flex:1, padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                    background:editForm.status===s?STATUS_COLORS[s]:"#f4f4f4",
                    color:editForm.status===s?"#fff":"#666", transition:"all 0.15s"
                  }}>{s}</button>
                ))}
              </div>

              <label style={labelStyle}>📱 Platform</label>
              <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                {PLATFORMS.map(p=>(
                  <button key={p.name} onClick={()=>setEditForm(f=>({...f, platform: f.platform===p.name ? "" : p.name}))} style={{
                    flex:"1 1 80px", padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                    background: editForm.platform===p.name ? p.color : "#f4f4f4",
                    color: editForm.platform===p.name ? "#fff" : "#666",
                    transition:"all 0.15s"
                  }}>{p.emoji} {p.name}</button>
                ))}
              </div>

              <label style={labelStyle}>🔒 Private Notes</label>
              <textarea value={editForm.notes} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))}
                placeholder="Raw brief, ideas, references… just for you."
                rows={4}
                style={{ ...inputStyle, resize:"vertical", lineHeight:1.5, marginBottom:18 }} />

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={save} style={{ flex:1, background:"#1a1a1a", color:"#fff", border:"none", borderRadius:10, padding:"11px 0", fontWeight:600, fontSize:13, cursor:"pointer" }}>Save</button>
                <button onClick={clear} style={{ background:"#f4f4f4", color:"#888", border:"none", borderRadius:10, padding:"11px 14px", fontWeight:600, fontSize:13, cursor:"pointer" }}>Clear</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const navBtn = { background:"none", border:"1.5px solid #e8e8e8", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:18, color:"#555" };
const labelStyle = { fontSize:11, fontWeight:600, color:"#888", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 };
const inputStyle = { width:"100%", border:"1.5px solid #ebebeb", borderRadius:10, padding:"9px 12px", fontSize:13, color:"#1a1a1a", background:"#fafafa", outline:"none", boxSizing:"border-box", fontFamily:"inherit" };