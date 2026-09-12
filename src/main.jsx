import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const artists = [
  { rank: 1, name: 'Luna Ray', country: 'Nigeria', continent: 'Africa', song: 'After Midnight', plays: '2.8M' },
  { rank: 2, name: 'Jay K', country: 'Zambia', continent: 'Africa', song: 'No Limits', plays: '2.4M' },
  { rank: 3, name: 'Amani', country: 'South Africa', continent: 'Africa', song: 'Higher', plays: '2.1M' },
  { rank: 4, name: 'Nia Blue', country: 'Ghana', continent: 'Africa', song: 'Golden', plays: '1.9M' },
  { rank: 5, name: 'Kairo', country: 'Kenya', continent: 'Africa', song: 'Run It', plays: '1.7M' },
  { rank: 6, name: 'Maya Stone', country: 'UK', continent: 'Europe', song: 'Midnight Lights', plays: '1.6M' },
  { rank: 7, name: 'Leo Nova', country: 'France', continent: 'Europe', song: 'Paris Nights', plays: '1.4M' },
  { rank: 8, name: 'Aiko', country: 'Japan', continent: 'Asia', song: 'Neon Sky', plays: '1.3M' },
  { rank: 9, name: 'Ravi', country: 'India', continent: 'Asia', song: 'Higher Ground', plays: '1.2M' },
  { rank: 10, name: 'Nova West', country: 'USA', continent: 'North America', song: 'Runaway', plays: '1.1M' },
  { rank: 11, name: 'Rio Sol', country: 'Brazil', continent: 'South America', song: 'Solamente', plays: '980K' },
  { rank: 12, name: 'Kai Ocean', country: 'Australia', continent: 'Oceania', song: 'Blue Horizon', plays: '920K' }
];

const continents = ['Africa', 'Europe', 'Asia', 'North America', 'South America', 'Oceania'];

function App() {
  const [tab, setTab] = useState('Home');
  const [playing, setPlaying] = useState(null);
  const [expandedPlayer, setExpandedPlayer] = useState(false);
  const [chart, setChart] = useState('Africa');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [accountType, setAccountType] = useState(null);
  const [signedIn, setSignedIn] = useState(false);

  const filteredSearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter(a =>
      `${a.name} ${a.song} ${a.country} ${a.continent}`.toLowerCase().includes(q)
    );
  }, [search]);

  const continentArtists = artists.filter(a => a.continent === chart);

  function startSong(song) {
    setPlaying(song);
    setExpandedPlayer(false);
  }

  return (
    <div className="app">
      <header>
        <div className="logo">MUSIC<span>WORLD</span></div>

        <button className="search" onClick={() => setSearchOpen(true)}>
          ⌕ <span>Search artists, songs...</span>
        </button>
      </header>

      <main>
        {tab === 'Home' && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">THE WORLD IS LISTENING</p>
                <h1>Discover music.<br /><em>Watch artists rise.</em></h1>
                <p className="sub">A global home for artists, listeners and the next #1.</p>
                <button onClick={() => startSong(artists[0])} className="primary">
                  ▶ Play Global #1
                </button>
              </div>
              <div className="heroBadge">#1<br /><small>GLOBAL</small></div>
            </section>

            <Section title="Global Top 10" action="View all">
              <div className="cards">
                {artists.slice(0, 4).map(a =>
                  <Track key={a.rank} a={a} onPlay={() => startSong(a)} />
                )}
              </div>
            </Section>

            <Section title="Rising Artists">
              <div className="rise">
                <div className="riseNum">#387 → #1</div>
                <div>
                  <b>Every artist has a journey.</b>
                  <p>Climb the chart from unknown to global.</p>
                </div>
              </div>
            </Section>

            <Section title="AI Music">
              <div className="ai">
                <b>🤖 AI Music</b>
                <span>Explore AI-generated, AI-assisted and experimental music.</span>
                <button onClick={() => setTab('Charts')}>Explore →</button>
              </div>
            </Section>
          </>
        )}

        {tab === 'Discover' && (
          <>
            <Title title="Explore the World" />

            <div className="grid">
              {continents.map(c => (
                <button
                  key={c}
                  className={`continent ${chart === c ? 'selected' : ''}`}
                  onClick={() => setChart(c)}
                >
                  <span>🌍</span>
                  <b>{c}</b>
                  <small>Charts · Artists · Genres</small>
                </button>
              ))}
            </div>

            <Section title={`${chart} Music`}>
              {continentArtists.length > 0 ? (
                <div className="chartList">
                  {continentArtists.map(a => (
                    <div className="row" key={a.rank}>
                      <strong>#{a.rank}</strong>
                      <div className="avatar">{a.name[0]}</div>
                      <div className="meta">
                        <b>{a.song}</b>
                        <small>{a.name} · {a.country}</small>
                      </div>
                      <span className="move">↑</span>
                      <button onClick={() => startSong(a)}>▶</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <div>♫</div>
                  <h2>Music coming soon</h2>
                  <p>Artists from {chart} will appear here.</p>
                </div>
              )}
            </Section>
          </>
        )}

        {tab === 'Charts' && (
          <>
            <Title title="Charts" />

            <div className="tabs">
              {['Global', 'Africa', 'Europe', 'Asia', 'North America', 'South America', 'Oceania'].map(x => (
                <button
                  className={chart === x ? 'sel' : ''}
                  onClick={() => setChart(x)}
                  key={x}
                >
                  {x}
                </button>
              ))}
            </div>

            <div className="chartList">
              {(chart === 'Global' ? artists : artists.filter(a => a.continent === chart)).map((a, i) => (
                <div className="row" key={a.rank}>
                  <strong>#{i + 1}</strong>
                  <div className="avatar">{a.name[0]}</div>
                  <div className="meta">
                    <b>{a.song}</b>
                    <small>{a.name} · {a.country}</small>
                  </div>
                  <span className="move">{i < 2 ? '↑' : '—'}</span>
                  <button onClick={() => startSong(a)}>▶</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'Library' && (
          <>
            <Title title="Your Library" />
            <div className="empty">
              <div>♫</div>
              <h2>Your music lives here.</h2>
              <p>Like songs and create playlists to build your library.</p>
              <button className="primary">Create playlist</button>
            </div>
          </>
        )}

        {tab === 'Profile' && (
          <>
            <Title title="Profile" />

            {!signedIn ? (
              <div className="profile">
                <div className="bigAvatar">♪</div>
                <h2>Welcome to MUSICWORLD</h2>
                <p>Create an account and choose how you want to use Music World.</p>

                {!accountType ? (
                  <div className="accountChoices">
                    <button className="accountCard" onClick={() => setAccountType('artist')}>
                      <span>🎤</span>
                      <b>I'm an Artist</b>
                      <small>Upload music and build your artist profile.</small>
                    </button>

                    <button className="accountCard" onClick={() => setAccountType('listener')}>
                      <span>🎧</span>
                      <b>I'm a Listener</b>
                      <small>Discover music, follow artists and build playlists.</small>
                    </button>
                  </div>
                ) : (
                  <div className="accountForm">
                    <h2>{accountType === 'artist' ? 'Artist Account' : 'Listener Account'}</h2>
                    <input placeholder="Your name or username" />
                    <input placeholder="Email address" type="email" />
                    <input placeholder="Password" type="password" />
                    <button className="primary" onClick={() => setSignedIn(true)}>
                      Create Account
                    </button>
                    <button onClick={() => setAccountType(null)}>← Choose another account type</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="profile">
                <div className="bigAvatar">{accountType === 'artist' ? '🎤' : '🎧'}</div>
                <h2>Your MUSICWORLD profile</h2>
                <p>{accountType === 'artist' ? 'Artist account' : 'Listener account'}</p>

                <div className="stats">
                  <div><b>0</b><small>Followers</small></div>
                  <div><b>0</b><small>Following</small></div>
                  <div><b>0</b><small>Playlists</small></div>
                </div>

                {accountType === 'artist' && (
                  <button className="primary" onClick={() => alert('Song upload area coming next!')}>
                    📤 Upload a Song
                  </button>
                )}

                <button onClick={() => setSignedIn(false)}>Log out</button>
              </div>
            )}
          </>
        )}
      </main>

      {searchOpen && (
        <div className="searchOverlay">
          <div className="searchBox">
            <button className="closeSearch" onClick={() => setSearchOpen(false)}>✕</button>
            <h2>Search Music World</h2>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search artists, songs, countries..."
            />

            <div className="searchResults">
              {filteredSearch.map(a => (
                <button key={a.rank} onClick={() => {
                  startSong(a);
                  setSearchOpen(false);
                }}>
                  <span className="avatar">{a.name[0]}</span>
                  <span>
                    <b>{a.song}</b>
                    <small>{a.name} · {a.country}</small>
                  </span>
                  <span>▶</span>
                </button>
              ))}

              {filteredSearch.length === 0 && <p>No music found.</p>}
            </div>
          </div>
        </div>
      )}

      <nav>
        {['Home', 'Discover', 'Charts', 'Library', 'Profile'].map(x => (
          <button
            className={tab === x ? 'active' : ''}
            onClick={() => setTab(x)}
            key={x}
          >
            <span>{({ Home: '⌂', Discover: '◉', Charts: '▥', Library: '♫', Profile: '●' })[x]}</span>
            {x}
          </button>
        ))}
      </nav>

      {playing && !expandedPlayer && (
        <div className="player" onClick={() => setExpandedPlayer(true)}>
          <div className="cover">♪</div>
          <div className="pmeta">
            <b>{playing.song}</b>
            <small>{playing.name}</small>
          </div>
          <button onClick={e => { e.stopPropagation(); setPlaying(null); }}>✕</button>
          <button className="play" onClick={e => e.stopPropagation()}>▶</button>
        </div>
      )}

      {playing && expandedPlayer && (
        <div className="fullPlayer">
          <button className="minimize" onClick={() => setExpandedPlayer(false)}>⌄</button>
          <div className="largeCover">♪</div>
          <p className="eyebrow">NOW PLAYING</p>
          <h1>{playing.song}</h1>
          <p>{playing.name} · {playing.country}</p>

          <div className="progress"><span></span></div>
          <div className="times"><small>0:00</small><small>3:24</small></div>

          <div className="controls">
            <button>↶</button>
            <button>▶</button>
            <button>↷</button>
          </div>

          <button className="closeFull" onClick={() => {
            setPlaying(null);
            setExpandedPlayer(false);
          }}>
            Close Player
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <section>
      <div className="sectionHead">
        <h2>{title}</h2>
        {action && <button>{action} →</button>}
      </div>
      {children}
    </section>
  );
}

function Title({ title }) {
  return (
    <div className="title">
      <p className="eyebrow">MUSICWORLD</p>
      <h1>{title}</h1>
    </div>
  );
}

function Track({ a, onPlay }) {
  return (
    <button className="track" onClick={onPlay}>
      <div className="art">♫</div>
      <b>#{a.rank} · {a.song}</b>
      <small>{a.name} · {a.country}</small>
      <span>▶</span>
    </button>
  );
}

createRoot(document.getElementById('root')).render(<App />);
