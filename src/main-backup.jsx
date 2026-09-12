import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const artists=[
 {rank:1,name:'Luna Ray',country:'Nigeria',song:'After Midnight',plays:'2.8M'},
 {rank:2,name:'Jay K',country:'Zambia',song:'No Limits',plays:'2.4M'},
 {rank:3,name:'Amani',country:'South Africa',song:'Higher',plays:'2.1M'},
 {rank:4,name:'Nia Blue',country:'Ghana',song:'Golden',plays:'1.9M'},
 {rank:5,name:'Kairo',country:'Kenya',song:'Run It',plays:'1.7M'}
];
const continents=['Africa','Europe','Asia','North America','South America','Oceania'];
function App(){
 const [tab,setTab]=useState('Home'); const [playing,setPlaying]=useState(null); const [chart,setChart]=useState('Global');
 return <div className="app">
  <header><div className="logo">MUSIC<span>WORLD</span></div><button className="search">⌕ <span>Search artists, songs...</span></button></header>
  <main>
   {tab==='Home'&&<><section className="hero"><div><p className="eyebrow">THE WORLD IS LISTENING</p><h1>Discover music.<br/><em>Watch artists rise.</em></h1><p className="sub">A global home for artists, listeners and the next #1.</p><button onClick={()=>setPlaying(artists[0])} className="primary">▶ Play Global #1</button></div><div className="heroBadge">#1<br/><small>GLOBAL</small></div></section>
    <Section title="Global Top 10" action="View all"><div className="cards">{artists.slice(0,4).map(a=><Track key={a.rank} a={a} onPlay={()=>setPlaying(a)}/>)}</div></Section>
    <Section title="Rising Artists"><div className="rise"><div className="riseNum">#387 → #1</div><div><b>Every artist has a journey.</b><p>Climb the chart from unknown to global.</p></div></div></Section>
    <Section title="AI Music"><div className="ai"><b>🤖 AI Music</b><span>Explore AI-generated, AI-assisted and experimental music.</span><button onClick={()=>setTab('Charts')}>Explore →</button></div></Section>
   </>}
   {tab==='Discover'&&<><Title title="Explore the World"/><div className="grid">{continents.map(c=><button key={c} className="continent" onClick={()=>setChart(c)}><span>🌍</span><b>{c}</b><small>Charts · Artists · Genres</small></button>)}</div><Section title="Africa"><div className="chips"><span>Africa Top 10</span><span>Africa Top 100</span><span>Rising Africa</span><span>Zambia</span><span>Nigeria</span><span>South Africa</span></div></Section></>}
   {tab==='Charts'&&<><Title title="Charts"/><div className="tabs">{['Global','Africa','Country','Genre','AI Music'].map(x=><button className={chart===x?'sel':''} onClick={()=>setChart(x)} key={x}>{x}</button>)}</div><div className="chartList">{artists.map((a,i)=><div className="row" key={a.rank}><strong>#{a.rank}</strong><div className="avatar">{a.name[0]}</div><div className="meta"><b>{a.song}</b><small>{a.name} · {a.country}</small></div><span className="move">{i===0?'↑':i===1?'↑':'—'}</span><button onClick={()=>setPlaying(a)}>▶</button></div>)}</div></>}
   {tab==='Library'&&<><Title title="Your Library"/><div className="empty"><div>♫</div><h2>Your music lives here.</h2><p>Like songs and create playlists to build your library.</p><button className="primary">Create playlist</button></div></>}
   {tab==='Profile'&&<><Title title="Profile"/><div className="profile"><div className="bigAvatar">C</div><h2>Your MUSICWORLD profile</h2><p>Follow artists, save music and track your discoveries.</p><div className="stats"><div><b>0</b><small>Followers</small></div><div><b>0</b><small>Following</small></div><div><b>0</b><small>Playlists</small></div></div></div></>}
  </main>
  <nav>{['Home','Discover','Charts','Library','Profile'].map(x=><button className={tab===x?'active':''} onClick={()=>setTab(x)} key={x}><span>{({Home:'⌂',Discover:'◉',Charts:'▥',Library:'♫',Profile:'●'})[x]}</span>{x}</button>)}</nav>
  {playing&&<div className="player"><div className="cover">♪</div><div className="pmeta"><b>{playing.song}</b><small>{playing.name}</small></div><button onClick={()=>setPlaying(null)}>✕</button><button className="play" onClick={()=>{}}>▶</button></div>}
 </div>
}
function Section({title,action,children}){return <section><div className="sectionHead"><h2>{title}</h2>{action&&<button>{action} →</button>}</div>{children}</section>}
function Title({title}){return <div className="title"><p className="eyebrow">MUSICWORLD</p><h1>{title}</h1></div>}
function Track({a,onPlay}){return <button className="track" onClick={onPlay}><div className="art">♫</div><b>#{a.rank} · {a.song}</b><small>{a.name} · {a.country}</small><span>▶</span></button>}
createRoot(document.getElementById('root')).render(<App/>);
