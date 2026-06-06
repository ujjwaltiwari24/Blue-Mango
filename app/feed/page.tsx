"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createPost, getPosts, toggleLike } from "@/services/post.service";
import { logoutUser } from "@/services/auth.service";

interface Post {
  id: string; text: string; anonymousName: string; mood: string;
  category: string; likes: number; comments: number; createdAt: unknown;
  liked: boolean; saved: boolean; featured?: boolean;
}

const ANON_NAMES = ["velvet fog","paper crane","hollow tide","still water","grey static","lost signal","dust mirror","neon silence","pale ember","dusk chorus"];
const MOODS = [
  { label:"Heartbroken", emoji:"💔", color:"#FB7185", bg:"rgba(251,113,133,0.12)", border:"rgba(251,113,133,0.28)" },
  { label:"Nostalgic",   emoji:"🌙", color:"#A78BFA", bg:"rgba(167,139,250,0.12)", border:"rgba(167,139,250,0.28)" },
  { label:"Grateful",    emoji:"✨", color:"#34D399", bg:"rgba(52,211,153,0.12)",  border:"rgba(52,211,153,0.28)"  },
  { label:"Anxious",     emoji:"⚡", color:"#FBBF24", bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.28)"  },
  { label:"Numb",        emoji:"🌫", color:"#94A3B8", bg:"rgba(148,163,184,0.12)", border:"rgba(148,163,184,0.28)" },
  { label:"Hopeful",     emoji:"🌤", color:"#38BDF8", bg:"rgba(56,189,248,0.12)",  border:"rgba(56,189,248,0.28)"  },
  { label:"Obsessed",    emoji:"🔥", color:"#F472B6", bg:"rgba(244,114,182,0.12)", border:"rgba(244,114,182,0.28)" },
];
const CATEGORIES = ["Confession","Relationship","Self","Family","Work","Regret","Secret","Hope"];
const ALL_CATS    = ["All",...CATEGORIES];
const TRENDING    = [{ tag:"3am thoughts",count:"2.4k"},{ tag:"unsent letters",count:"1.8k"},{ tag:"things I pretend",count:"1.2k"},{ tag:"never told anyone",count:"987"},{ tag:"exes",count:"741"}];
const SAMPLE: Post[] = [
  { id:"p1",text:"I still keep a voice note from 2019 of someone who doesn't remember me anymore. I listen to it when I miss who I used to be.",anonymousName:"hollow tide",mood:"Nostalgic",category:"Regret",likes:1847,comments:94,createdAt:"3h ago",liked:false,saved:false,featured:true },
  { id:"p2",text:"I told my therapist I was fine. Then I drove home and sat in my parking lot for 45 minutes because I didn't know what to do with silence.",anonymousName:"grey static",mood:"Numb",category:"Self",likes:3291,comments:201,createdAt:"5h ago",liked:true,saved:false,featured:false },
  { id:"p3",text:"My biggest secret is that I'm actually doing okay. And I feel guilty about it when everyone around me is falling apart.",anonymousName:"velvet fog",mood:"Anxious",category:"Confession",likes:912,comments:58,createdAt:"8h ago",liked:false,saved:true,featured:false },
  { id:"p4",text:"I gave them a second chance. And a third. And a fourth. I just wanted to believe people can change more than I wanted to protect myself.",anonymousName:"still water",mood:"Heartbroken",category:"Relationship",likes:2103,comments:137,createdAt:"12h ago",liked:false,saved:false,featured:false },
  { id:"p5",text:'I rehearse conversations in my head for hours. Then I go completely blank and just say "yeah, totally."',anonymousName:"dust mirror",mood:"Anxious",category:"Self",likes:687,comments:45,createdAt:"1d ago",liked:true,saved:false,featured:false },
];

const getMood = (l:string) => MOODS.find(m=>m.label===l) ?? { label:l,emoji:"💭",color:"#60A5FA",bg:"rgba(96,165,250,0.12)",border:"rgba(96,165,250,0.28)" };
function fmt(n:number){ return n>=1000?(n/1000).toFixed(1).replace(/\.0$/,"")+"k":String(n); }
function timeAgo(raw:unknown):string{
  if(!raw)return"just now";
  if(typeof raw==="string"&&!raw.includes("T")&&!raw.includes("Z"))return raw;
  let d:Date|null=null;
  if(typeof raw==="string")d=new Date(raw);
  else if(raw instanceof Date)d=raw;
  else if(typeof raw==="object"&&(raw as any)?.toDate)d=(raw as any).toDate();
  if(!d||isNaN(d.getTime()))return"just now";
  const s=(Date.now()-d.getTime())/1000;
  if(s<60)return"just now";if(s<3600)return`${Math.floor(s/60)}m ago`;
  if(s<86400)return`${Math.floor(s/3600)}h ago`;return`${Math.floor(s/86400)}d ago`;
}
function randomAnon(){ return ANON_NAMES[Math.floor(Math.random()*ANON_NAMES.length)]; }

// ── Inline SVG icons ──────────────────────────────────────────────────────
const Ic = {
  heart:(f?:boolean)=><svg width="15" height="15" viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  chat:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  share:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  bookmark:(f?:boolean)=><svg width="15" height="15" viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  send:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  lock:()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  shield:()=><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bell:()=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  user:()=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  trend:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  filter:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  refresh:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  more:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  home:()=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  sparkle:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9L12 2z"/></svg>,
  check:()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  plus:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chevron:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  down:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
};

// ── Custom Dropdown (replaces native <select>) ─────────────────────────────
function Dropdown({ value, options, onChange }: { value:string; options:string[]; onChange:(v:string)=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e:MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if(open) document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[open]);

  return (
    <div ref={ref} style={{ position:"relative", flexShrink:0 }}>
      <button type="button" onClick={()=>setOpen(v=>!v)} style={{
        display:"flex", alignItems:"center", gap:6,
        padding:"8px 12px", borderRadius:10, fontSize:11, fontWeight:500,
        color:"rgba(255,255,255,0.65)", cursor:"pointer",
        background:"rgba(255,255,255,0.06)",
        border:"1px solid rgba(255,255,255,0.1)",
        transition:"all 0.18s", minWidth:100,
        justifyContent:"space-between",
      }}>
        <span>{value}</span>
        <span style={{ opacity:0.5, transition:"transform 0.2s", transform:open?"rotate(180deg)":"rotate(0deg)" }}>{Ic.down()}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:-6,scale:0.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-4,scale:0.97}}
            transition={{duration:0.15}} style={{
              position:"absolute", bottom:"calc(100% + 6px)", left:0, zIndex:100,
              minWidth:140, borderRadius:12, overflow:"hidden",
              background:"#111827", border:"1px solid rgba(255,255,255,0.1)",
              boxShadow:"0 12px 40px rgba(0,0,0,0.7)",
            }}>
            {options.map(o=>(
              <button key={o} type="button" onClick={()=>{onChange(o);setOpen(false);}} style={{
                display:"block", width:"100%", textAlign:"left",
                padding:"10px 14px", fontSize:12, cursor:"pointer",
                color: value===o ? "#93C5FD" : "rgba(255,255,255,0.55)",
                background: value===o ? "rgba(37,99,235,0.15)" : "transparent",
                border:"none", transition:"all 0.12s",
              }}
                onMouseEnter={e=>{if(value!==o)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.05)";}}
                onMouseLeave={e=>{if(value!==o)(e.currentTarget as HTMLElement).style.background="transparent";}}
              >{o}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────
function Header({onLogout}:{onLogout:()=>void}) {
  const [scrolled,setScrolled] = useState(false);
  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>10);
    window.addEventListener("scroll",h,{passive:true});
    return ()=>window.removeEventListener("scroll",h);
  },[]);
  const S = (s:React.CSSProperties):React.CSSProperties => s;
  return (
    <header style={S({
      position:"sticky",top:0,zIndex:50,
      background:scrolled?"rgba(6,8,16,0.9)":"transparent",
      backdropFilter:scrolled?"blur(24px)":"none",
      WebkitBackdropFilter:scrolled?"blur(24px)":"none",
      borderBottom:scrolled?"1px solid rgba(255,255,255,0.06)":"1px solid transparent",
      transition:"all 0.3s ease",
    })}>
      <div style={{maxWidth:1160,margin:"0 auto",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#D6A86B,#C06C84)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",flexShrink:0}}>
            {Ic.sparkle()}
            <span style={{position:"absolute",top:-2,right:-2,width:8,height:8,borderRadius:"50%",background:"#10B981",border:"2px solid #060810"}}/>
          </div>
          <div>
            <p style={{fontFamily:"Georgia,serif",fontSize:19,fontWeight:700,color:"#fff",lineHeight:1,margin:0}}>BlueMango</p>
            <p style={{fontSize:9,letterSpacing:"2.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.22)",margin:0}} className="bm-subtext">anonymous confessions</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {[{href:"/notifications",icon:Ic.bell(),dot:true},{href:"/profile",icon:Ic.user(),dot:false}].map(({href,icon,dot})=>(
            <a key={href} href={href} style={{position:"relative",width:40,height:40,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.45)",transition:"all 0.2s",textDecoration:"none"}}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.07)")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              {icon}
              {dot&&<span style={{position:"absolute",top:7,right:7,width:6,height:6,borderRadius:"50%",background:"#C06C84",border:"1.5px solid #060810"}}/>}
            </a>
          ))}
          <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:20,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.5)",fontSize:12,cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>{const t=e.currentTarget;t.style.borderColor="rgba(251,113,133,0.4)";t.style.color="#FB7185";}}
            onMouseLeave={e=>{const t=e.currentTarget;t.style.borderColor="rgba(255,255,255,0.08)";t.style.color="rgba(255,255,255,0.5)";}}>
            {Ic.logout()} <span className="bm-leave">Leave</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────
function Stats({count}:{count:number}) {
  const items = [
    {v:String(count), l:"Confessions", c:"#8B5CF6", bg:"rgba(139,92,246,0.12)"},
    {v:"2,419",       l:"Online now",  c:"#10B981", bg:"rgba(16,185,129,0.12)"},
    {v:"12",          l:"Trending",    c:"#D6A86B", bg:"rgba(214,168,107,0.12)"},
    {v:"100%",        l:"Anonymous",   c:"#C06C84", bg:"rgba(192,108,132,0.12)"},
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:18}} className="bm-stats">
      {items.map(s=>(
        <div key={s.l} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,border:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.02)"}}>
          <div style={{width:36,height:36,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:15,fontWeight:800,color:s.c}}>{s.v.length>3?s.v[0]:s.v}</span>
          </div>
          <div>
            <p style={{fontSize:17,fontWeight:700,color:"#fff",margin:0,lineHeight:1.2}}>{s.v}</p>
            <p style={{fontSize:10,color:"rgba(255,255,255,0.3)",margin:0,marginTop:2}}>{s.l}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Featured Card ─────────────────────────────────────────────────────────
function FeaturedCard({post,onLike}:{post:Post;onLike:(id:string)=>void}) {
  const m = getMood(post.mood);
  return (
    <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.45}}
      style={{position:"relative",overflow:"hidden",borderRadius:20,marginBottom:14,padding:"20px",background:"linear-gradient(135deg,#0d1628 0%,#0a0e1f 100%)",border:"1px solid rgba(255,255,255,0.08)"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-30,left:-30,width:130,height:130,borderRadius:"50%",background:"radial-gradient(circle,rgba(192,108,132,0.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"relative"}}>
        <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,marginBottom:12}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,fontSize:10,color:"#D6A86B",background:"rgba(214,168,107,0.12)",border:"1px solid rgba(214,168,107,0.25)"}}>🔥 Most resonated today</span>
          <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:10,color:m.color,background:m.bg,border:`1px solid ${m.border}`}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:m.color,display:"inline-block"}}/>{post.mood}
          </span>
        </div>
        <p style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:"clamp(16px,4vw,20px)",fontStyle:"italic",lineHeight:1.65,color:"rgba(255,255,255,0.9)",marginBottom:16,margin:"0 0 16px 0"}}>"{post.text}"</p>
        <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{post.anonymousName} · {timeAgo(post.createdAt)}</span>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button onClick={()=>onLike(post.id)} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:post.liked?"#C06C84":"rgba(255,255,255,0.35)",background:"none",border:"none",cursor:"pointer",transition:"color 0.2s"}}>
              {Ic.heart(post.liked)} {fmt(post.likes)}
            </button>
            <span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"rgba(255,255,255,0.3)"}}>{Ic.chat()} {fmt(typeof post.comments==="number"?post.comments:0)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Composer (no native select — uses custom Dropdown) ────────────────────
function Composer({text,setText,mood,setMood,category,setCategory,loading,onPost}:{
  text:string;setText:(v:string)=>void;mood:string;setMood:(v:string)=>void;
  category:string;setCategory:(v:string)=>void;loading:boolean;onPost:()=>void;
}) {
  const [open,setOpen] = useState(false);
  const max=400; const pct=(text.length/max)*100;
  const r=9; const circ=2*Math.PI*r;
  return (
    <div style={{borderRadius:18,border:open?"1px solid rgba(37,99,235,0.3)":"1px solid rgba(255,255,255,0.07)",background:open?"rgba(255,255,255,0.045)":"rgba(255,255,255,0.025)",transition:"all 0.25s ease",marginBottom:14,boxShadow:open?"0 8px 32px rgba(0,0,0,0.4)":"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,rgba(37,99,235,0.35),rgba(139,92,246,0.35))",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.5)"}}>
          {Ic.lock()}
        </div>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>posting as</span>
        <span style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.65)"}}>anonymous</span>
        <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4,fontSize:10,color:"rgba(52,211,153,0.7)"}}>
          {Ic.shield()} <span className="bm-protected">end-to-end protected</span>
        </span>
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value.slice(0,max))} onFocus={()=>setOpen(true)}
        onBlur={()=>{if(!text)setOpen(false);}}
        placeholder="What are you carrying that you've never said out loud?"
        rows={open||text?4:2}
        style={{width:"100%",resize:"none",background:"transparent",border:"none",outline:"none",padding:"14px",fontSize:14,lineHeight:1.7,color:"rgba(255,255,255,0.82)",fontFamily:"inherit",transition:"all 0.2s"}}/>
      <AnimatePresence>
        {open&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
            {/* mood pills */}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              {MOODS.map(mo=>(
                <button key={mo.label} type="button" onClick={()=>setMood(mo.label)} style={{
                  display:"flex",alignItems:"center",gap:5,padding:"6px 11px",borderRadius:20,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.15s",
                  color:mood===mo.label?mo.color:"rgba(255,255,255,0.38)",
                  background:mood===mo.label?mo.bg:"rgba(255,255,255,0.03)",
                  border:`1px solid ${mood===mo.label?mo.border:"rgba(255,255,255,0.08)"}`,
                }}>
                  <span style={{fontSize:12}}>{mo.emoji}</span>{mo.label}
                </button>
              ))}
            </div>
            {/* toolbar — custom dropdown instead of native select */}
            <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:10,padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              <Dropdown value={category} options={CATEGORIES} onChange={setCategory}/>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <svg width="22" height="22" style={{transform:"rotate(-90deg)",flexShrink:0}}>
                  <circle cx="11" cy="11" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2"/>
                  <circle cx="11" cy="11" r={r} fill="none" stroke={pct>85?"#FB7185":pct>65?"#FBBF24":"#2563EB"} strokeWidth="2" strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round" style={{transition:"all 0.2s"}}/>
                </svg>
                <button type="button" onClick={onPost} disabled={!text.trim()||loading} style={{
                  display:"flex",alignItems:"center",gap:7,padding:"10px 18px",borderRadius:12,fontSize:12,fontWeight:600,color:"#fff",
                  cursor:text.trim()&&!loading?"pointer":"not-allowed",opacity:text.trim()&&!loading?1:0.42,
                  background:"linear-gradient(135deg,#2563EB,#6366F1)",border:"none",transition:"all 0.2s",
                  boxShadow:text.trim()?"0 4px 18px rgba(37,99,235,0.38)":"none",
                }}>
                  {loading?<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:"bm-spin 0.8s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>:Ic.send()}
                  Confess
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes bm-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Category Filter ────────────────────────────────────────────────────────
function CatBar({active,onChange}:{active:string;onChange:(c:string)=>void}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:14,scrollbarWidth:"none"} as React.CSSProperties}>
      <span style={{color:"rgba(255,255,255,0.25)",flexShrink:0}}>{Ic.filter()}</span>
      {ALL_CATS.map(c=>(
        <button key={c} onClick={()=>onChange(c)} style={{flexShrink:0,padding:"7px 14px",borderRadius:20,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.18s",border:"none",color:active===c?"#93C5FD":"rgba(255,255,255,0.32)",background:active===c?"rgba(37,99,235,0.2)":"transparent",boxShadow:active===c?"0 0 0 1px rgba(37,99,235,0.3)":"none"}}>
          {c}
        </button>
      ))}
    </div>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────────
function PostCard({post,onLike,onSave,index}:{post:Post;onLike:(id:string)=>void;onSave:(id:string)=>void;index:number}) {
  const [exp,setExp] = useState(false);
  const m=getMood(post.mood);
  const long=post.text.length>200;
  const body=exp||!long?post.text:post.text.slice(0,200)+"…";
  const t=timeAgo(post.createdAt);
  const cc=typeof post.comments==="number"?post.comments:0;
  const [hov,setHov]=useState(false);
  return (
    <motion.article initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3,delay:index*0.05}}
      style={{borderRadius:18,padding:"16px",border:hov?"1px solid rgba(255,255,255,0.11)":"1px solid rgba(255,255,255,0.065)",background:hov?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.025)",transition:"all 0.22s ease",position:"relative",overflow:"hidden"}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{position:"absolute",inset:"0 0 auto 0",height:1,background:hov?"linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)":"none",transition:"all 0.3s"}}/>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12,gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,rgba(37,99,235,0.45),rgba(139,92,246,0.35))",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)"}}>
            {Ic.lock()}
          </div>
          <div>
            <p style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.78)",margin:0}}>{post.anonymousName}</p>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.26)",margin:0,marginTop:1}}>{t}</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:500,color:m.color,background:m.bg,border:`1px solid ${m.border}`}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:m.color,display:"inline-block"}}/>{post.mood}
          </span>
          <button style={{padding:4,borderRadius:7,border:"none",background:"transparent",color:"rgba(255,255,255,0.22)",cursor:"pointer",display:"flex",transition:"all 0.15s"}}
            onMouseEnter={e=>{const t=e.currentTarget;t.style.background="rgba(255,255,255,0.07)";t.style.color="rgba(255,255,255,0.55)";}}
            onMouseLeave={e=>{const t=e.currentTarget;t.style.background="transparent";t.style.color="rgba(255,255,255,0.22)";}}>
            {Ic.more()}
          </button>
        </div>
      </div>
      <p style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:15,fontStyle:"italic",lineHeight:1.75,color:"rgba(255,255,255,0.75)",margin:"0 0 14px 0"}}>
        {body}
        {long&&<button onClick={()=>setExp(v=>!v)} style={{marginLeft:6,fontSize:12,fontStyle:"normal",color:"rgba(96,165,250,0.75)",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>{exp?"show less":"read more"}</button>}
      </p>
      <div style={{display:"flex",alignItems:"center",gap:2}}>
        {[
          {action:()=>onLike(post.id),icon:Ic.heart(post.liked),label:fmt(post.likes),active:post.liked,ac:"#C06C84",abg:"rgba(192,108,132,0.1)",aring:"rgba(192,108,132,0.22)"},
          {action:undefined,icon:Ic.chat(),label:fmt(cc),active:false,ac:"",abg:"",aring:""},
          {action:()=>navigator.clipboard.writeText(`${window.location.origin}/p/${post.id}`).catch(()=>{}),icon:Ic.share(),label:"",active:false,ac:"",abg:"",aring:""},
        ].map((btn,bi)=>(
          <button key={bi} onClick={btn.action} style={{
            display:"flex",alignItems:"center",gap:6,padding:"7px 11px",borderRadius:10,fontSize:12,fontWeight:500,border:"none",cursor:btn.action?"pointer":"default",transition:"all 0.18s",
            color:btn.active?btn.ac:"rgba(255,255,255,0.32)",background:btn.active?btn.abg:"transparent",boxShadow:btn.active?`0 0 0 1px ${btn.aring}`:"none",
          }}
            onMouseEnter={e=>{if(!btn.active)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.05)";}}
            onMouseLeave={e=>{if(!btn.active)(e.currentTarget as HTMLElement).style.background="transparent";}}>
            {btn.icon}{btn.label}
          </button>
        ))}
        <button onClick={()=>onSave(post.id)} style={{
          marginLeft:"auto",display:"flex",alignItems:"center",gap:6,padding:"7px 11px",borderRadius:10,fontSize:12,border:"none",cursor:"pointer",transition:"all 0.18s",
          color:post.saved?"#D6A86B":"rgba(255,255,255,0.25)",background:post.saved?"rgba(214,168,107,0.1)":"transparent",boxShadow:post.saved?"0 0 0 1px rgba(214,168,107,0.22)":"none",
        }}>
          {Ic.bookmark(post.saved)}
        </button>
      </div>
    </motion.article>
  );
}

// ── Left Sidebar ───────────────────────────────────────────────────────────
function LeftSidebar() {
  return (
    <nav style={{display:"flex",flexDirection:"column",gap:3}}>
      {[{l:"Feed",a:true},{l:"Trending",a:false},{l:"Saved",a:false},{l:"Following",a:false}].map(({l,a})=>(
        <button key={l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:12,fontSize:13,fontWeight:500,cursor:"pointer",transition:"all 0.18s",border:"none",color:a?"#93C5FD":"rgba(255,255,255,0.42)",background:a?"rgba(37,99,235,0.14)":"transparent",boxShadow:a?"0 0 0 1px rgba(37,99,235,0.22)":"none"}}>
          {l}{a&&<span style={{width:6,height:6,borderRadius:"50%",background:"#60A5FA"}}/>}
        </button>
      ))}
      <div style={{marginTop:14,padding:16,borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)"}}>
        <p style={{fontSize:9,textTransform:"uppercase",letterSpacing:"2px",color:"rgba(255,255,255,0.2)",margin:"0 0 4px 0"}}>Live now</p>
        <p style={{fontSize:26,fontWeight:700,color:"#fff",margin:0,lineHeight:1.2}}>2,419</p>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.3)",margin:"0 0 12px 0"}}>anonymous souls online</p>
        <div style={{display:"flex",gap:3}}>
          {[0.55,0.82,0.37,0.91,0.48,0.74,0.63,0.88].map((o,i)=>(
            <div key={i} style={{flex:1,height:5,borderRadius:3,background:"#10B981",opacity:o}}/>
          ))}
        </div>
      </div>
      <div style={{marginTop:10,padding:14,borderRadius:16,border:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.015)"}}>
        <p style={{fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.5)",margin:"0 0 5px 0"}}>Your anonymous link</p>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.25)",margin:"0 0 10px 0",lineHeight:1.5}}>Let others message you anonymously.</p>
        <button onClick={()=>navigator.clipboard.writeText(window.location.origin+"/profile").catch(()=>{})} style={{width:"100%",padding:"8px 0",borderRadius:10,fontSize:11,color:"#60A5FA",background:"rgba(37,99,235,0.1)",border:"1px solid rgba(37,99,235,0.22)",cursor:"pointer",transition:"all 0.18s"}}>
          Copy profile link
        </button>
      </div>
    </nav>
  );
}

// ── Right Sidebar ──────────────────────────────────────────────────────────
function RightSidebar() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{padding:16,borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
          <span style={{color:"#D6A86B"}}>{Ic.trend()}</span>
          <p style={{fontSize:10,textTransform:"uppercase",letterSpacing:"2px",color:"rgba(255,255,255,0.25)",margin:0}}>Trending</p>
        </div>
        {TRENDING.map((t,i)=>(
          <button key={t.tag} style={{display:"flex",width:"100%",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderRadius:10,fontSize:12,cursor:"pointer",transition:"all 0.15s",background:"transparent",border:"none",color:"inherit"}}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.05)")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.2)",minWidth:16}}>#{i+1}</span>
              <span style={{color:"rgba(255,255,255,0.62)"}}>#{t.tag}</span>
            </div>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{t.count}</span>
          </button>
        ))}
      </div>
      <div style={{padding:16,borderRadius:16,border:"1px solid rgba(16,185,129,0.12)",background:"rgba(16,185,129,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
          <span style={{color:"#34D399"}}>{Ic.shield()}</span>
          <p style={{fontSize:12,fontWeight:500,color:"#34D399",margin:0}}>Our Promise</p>
        </div>
        {["No accounts required to read","Zero analytics on you","Posts auto-delete in 48h","No ads, ever"].map(l=>(
          <div key={l} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:7}}>
            <span style={{color:"rgba(52,211,153,0.6)",marginTop:1,flexShrink:0}}>{Ic.check()}</span>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.38)",lineHeight:1.5}}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{position:"relative",overflow:"hidden",padding:16,borderRadius:16,background:"linear-gradient(135deg,rgba(37,99,235,0.12),rgba(139,92,246,0.1))",border:"1px solid rgba(99,102,241,0.15)"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.25),transparent)",pointerEvents:"none"}}/>
        <p style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.82)",margin:"0 0 4px 0"}}>Got a secret?</p>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.3)",margin:"0 0 12px 0",lineHeight:1.5}}>The right words find the right people.</p>
        <button style={{display:"flex",width:"100%",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 0",borderRadius:12,fontSize:12,fontWeight:500,color:"#93C5FD",background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.25)",cursor:"pointer",transition:"all 0.18s"}}
          onMouseEnter={e=>(e.currentTarget.style.background="rgba(37,99,235,0.25)")}
          onMouseLeave={e=>(e.currentTarget.style.background="rgba(37,99,235,0.15)")}>
          {Ic.plus()} Share anonymously
        </button>
      </div>
    </div>
  );
}

// ── Mobile Nav ─────────────────────────────────────────────────────────────
function MobileNav() {
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:"rgba(6,8,16,0.94)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:"1px solid rgba(255,255,255,0.06)"}} className="bm-bottom-nav">
      <div style={{maxWidth:480,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-around",padding:"6px 8px"}}>
        {[{href:"/feed",icon:Ic.home(),label:"Feed"},{href:"/notifications",icon:Ic.bell(),label:"Inbox"},{href:"/profile",icon:Ic.user(),label:"Profile"}].map(({href,icon,label})=>(
          <a key={href} href={href} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 0",borderRadius:12,color:"rgba(255,255,255,0.3)",fontSize:10,fontWeight:500,textDecoration:"none",transition:"color 0.2s"}}
            onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.75)")}
            onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.3)")}>
            {icon}{label}
          </a>
        ))}
      </div>
    </nav>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function FeedPage() {
  const router = useRouter();
  const [posts,setPosts]       = useState<Post[]>(SAMPLE);
  const [text,setText]         = useState("");
  const [mood,setMood]         = useState("Nostalgic");
  const [category,setCategory] = useState("Confession");
  const [filter,setFilter]     = useState("All");
  const [loading,setLoading]   = useState(false);

  useEffect(()=>{
    getPosts().then(d=>{if(Array.isArray(d)&&d.length)setPosts(d as Post[]);}).catch(()=>{});
  },[]);

  const handlePost = useCallback(async()=>{
    if(!text.trim())return; setLoading(true);
    try{
      await createPost(text,randomAnon(),mood,category);
      const f=await getPosts();
      if(Array.isArray(f)&&f.length)setPosts(f as Post[]);
      else setPosts(p=>[{id:`l-${Date.now()}`,text,anonymousName:randomAnon(),mood,category,likes:0,comments:0,createdAt:new Date(),liked:false,saved:false},...p]);
      setText("");
    }catch{alert("Could not post. Try again.");}
    finally{setLoading(false);}
  },[text,mood,category]);

  const handleLike = useCallback(async(id:string)=>{
    const t=posts.find(p=>p.id===id); if(!t)return;
    try{
      await toggleLike(id,t.liked||false);
      setPosts(p=>p.map(x=>x.id===id?{...x,liked:!x.liked,likes:x.likes+(x.liked?-1:1)}:x));
    }catch(e){console.error(e);}
  },[posts]);

  const handleSave  = useCallback((id:string)=>setPosts(p=>p.map(x=>x.id===id?{...x,saved:!x.saved}:x)),[]);
  const handleLogout= useCallback(async()=>{try{await logoutUser();}catch{}router.push("/login");},[router]);

  const featured = posts.find(p=>p.featured)??posts[0];
  const filtered = posts.filter(p=>!p.featured&&(filter==="All"||p.category===filter));

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060810;color:#fff;font-family:'Sora','DM Sans',system-ui,sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:3px}
        input,textarea,button{font-family:inherit}
        a{text-decoration:none}
        @media(min-width:768px){.bm-bottom-nav{display:none!important}}
        @media(min-width:1024px){.bm-grid{grid-template-columns:200px 1fr 240px!important}.bm-left{display:block!important}.bm-right{display:block!important}}
        @media(min-width:640px){.bm-stats{grid-template-columns:repeat(4,1fr)!important}}
        @media(max-width:380px){.bm-leave{display:none!important}.bm-protected{display:none!important}.bm-subtext{display:none!important}}
      `}</style>
      {/* bg */}
      <div style={{position:"fixed",inset:0,zIndex:-1,background:"#060810",pointerEvents:"none"}}>
        <div style={{position:"absolute",top:-120,left:-120,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(37,99,235,0.13) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",top:"30%",right:-150,width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,0.09) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:-100,left:"35%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle,rgba(192,108,132,0.08) 0%,transparent 70%)"}}/>
      </div>
      <div style={{minHeight:"100vh",paddingBottom:80}} className="bm-page">
        <Header onLogout={handleLogout}/>
        <div style={{maxWidth:1160,margin:"0 auto",padding:"18px 14px"}}>
          <Stats count={posts.length}/>
          <div style={{display:"grid",gap:22,gridTemplateColumns:"1fr"}} className="bm-grid">
            <div style={{display:"none"}} className="bm-left"><LeftSidebar/></div>
            <div style={{minWidth:0}}>
              {featured&&<FeaturedCard post={featured} onLike={handleLike}/>}
              <Composer text={text} setText={setText} mood={mood} setMood={setMood} category={category} setCategory={setCategory} loading={loading} onPost={handlePost}/>
              <CatBar active={filter} onChange={setFilter}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <p style={{fontSize:10,textTransform:"uppercase",letterSpacing:"2px",color:"rgba(255,255,255,0.2)"}}>Recent whispers</p>
                <button onClick={async()=>{try{const f=await getPosts();if(Array.isArray(f)&&f.length)setPosts(f as Post[]);}catch{}}} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(255,255,255,0.25)",background:"none",border:"none",cursor:"pointer",transition:"color 0.15s"}}
                  onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.55)")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.25)")}>
                  {Ic.refresh()} Refresh
                </button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {filtered.length===0?(
                  <div style={{padding:"60px 0",textAlign:"center"}}>
                    <p style={{fontSize:28,marginBottom:10,opacity:0.15}}>🌙</p>
                    <p style={{fontSize:13,color:"rgba(255,255,255,0.3)"}}>Nothing here yet.</p>
                    <p style={{fontSize:11,color:"rgba(255,255,255,0.18)",marginTop:5}}>Be the first to confess.</p>
                  </div>
                ):filtered.map((p,i)=><PostCard key={p.id} post={p} onLike={handleLike} onSave={handleSave} index={i}/>)}
              </div>
              {filtered.length>0&&(
                <button style={{marginTop:14,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 0",borderRadius:12,fontSize:12,color:"rgba(255,255,255,0.28)",background:"transparent",border:"1px solid rgba(255,255,255,0.07)",cursor:"pointer",transition:"all 0.18s"}}
                  onMouseEnter={e=>{const t=e.currentTarget;t.style.borderColor="rgba(255,255,255,0.13)";t.style.color="rgba(255,255,255,0.5)";}}
                  onMouseLeave={e=>{const t=e.currentTarget;t.style.borderColor="rgba(255,255,255,0.07)";t.style.color="rgba(255,255,255,0.28)";}}>
                  Load older confessions {Ic.chevron()}
                </button>
              )}
            </div>
            <div style={{display:"none"}} className="bm-right"><RightSidebar/></div>
          </div>
        </div>
        <MobileNav/>
      </div>
      <style>{`@media(min-width:768px){.bm-page{padding-bottom:0!important}}`}</style>
    </>
  );
}