import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { registerPlugin } from '@capacitor/core';
import './styles.css';

const DeviceMusic = registerPlugin('DeviceMusic');	
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
  const openDeviceMusic = async () => {
    setDeviceMusicOpen(true);
    setDeviceMusicLoading(true);

    try {

      const permission = await DeviceMusic.requestPermission();
      if (!permission.granted) {
        setDeviceMusic([]);
        alert('Music permission is required to access music on this phone.');
        setDeviceMusicLoading(false);
        return;
      }

      const result = await DeviceMusic.getSongs();
      setDeviceMusic(result.songs || []);
    } catch (error) {
      console.error('Device Music error:', error);
      setDeviceMusic([]); alert('Device Music error: ' + (error?.message || error));
    }

    setDeviceMusicLoading(false);
  };
  const [tab, setTab] = useState('Home');
  const [playing, setPlaying] = useState(null);
  const [expandedPlayer, setExpandedPlayer] = useState(false);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chart, setChart] = useState('Africa');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [settings, setSettings] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [font, setFont] = useState('system');
  const [fontStyle, setFontStyle] = useState('normal');
  const [fontSize, setFontSize] = useState('medium'); 
  const [deviceMusic, setDeviceMusic] = useState([]);
  const [deviceMusicOpen, setDeviceMusicOpen] = useState(false);
  const [deviceMusicLoading, setDeviceMusicLoading] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const filteredSearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return artists;

    return artists.filter(a =>
      `${a.name} ${a.song}`
        .toLowerCase()
        .includes(q)
    );
  }, [search]);

  const continentArtists = artists.filter(a => a.continent === chart);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font', font);
    document.documentElement.setAttribute('data-font-style', fontStyle);
    document.documentElement.setAttribute('data-font-size', fontSize);
}, [font, fontStyle, fontSize]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime * 1000);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration * 1000);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function formatTime(ms) {
    if (!ms || !Number.isFinite(ms)) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }


  async function startSong(song) {
    setPlaying(song);
    setExpandedPlayer(false);
    setCurrentTime(0);
    setDuration(song?.duration || 0);

    if (song?.uri) {
      try {
        await DeviceMusic.play({ uri: song.uri });
        setIsPlaying(true);
      } catch (error) {
        setIsPlaying(false);
        console.error("Native audio playback error:", error);
        alert("Unable to play this song.");
      }
    } else {
      setIsPlaying(false);
    }
  }

  async function togglePlayback(e) {
    if (e) e.stopPropagation();

    if (!playing?.uri) return;

    try {
      if (isPlaying) {
        await DeviceMusic.pause();
        setIsPlaying(false);
      } else {
        await DeviceMusic.resume();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Native playback error:", error);
    }
  }
  function addToPlaylist(song) {
    if (!playlist.some(item => item.rank === song.rank)) {
      setPlaylist([...playlist, song]);
    }
  }

  function goBack() {
    if (expandedPlayer) {
      setExpandedPlayer(false);
      return;
    }

    if (searchOpen) {
      setSearchOpen(false);
      return;
    }

    if (settings) {
      setSettings(false);
      return;
    }

    if (showSignIn) {
      setShowSignIn(false);
      return;
    }

    setTab('Home');
  }

  return (
    <div className="app">
      <audio ref={audioRef} />

      <header>
        <div className="logo">
          MUSIC<span>WORLD</span>
        </div>

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
                <p className="sub">
                  A global home for artists, listeners and the next #1.
                </p>

                <button
                  onClick={() => startSong(artists[0])}
                  className="primary"
                >
                  ▶ Play Global #1
                </button>
              </div>

              <div className="heroBadge">
                #1<br /><small>GLOBAL</small>
              </div>
            </section>

            <Section title="Global Top 10" action="View all">
              <div className="cards">
                {artists.slice(0, 4).map(a => (
                  <Track
                    key={a.rank}
                    a={a}
                    onPlay={() => startSong(a)}
                  />
                ))}
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
              {['Global', ...continents].map(x => (
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
              {(chart === 'Global'
                ? artists
                : artists.filter(a => a.continent === chart)
              ).map((a, i) => (
                <div className="row" key={a.rank}>
                  <strong>#{i + 1}</strong>
                  <div className="avatar">{a.name[0]}</div>

                  <div className="meta">
                    <b>{a.song}</b>
                    <small>{a.name} · {a.country}</small>
                  </div>

                  <button onClick={() => startSong(a)}>▶</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'Library' && (
          <>
            <Title title="Your Library" />

{deviceMusicOpen ? (
  <>
    <button
      className="backButton"
      onClick={() => setDeviceMusicOpen(false)}
    >
      ← Your Library
    </button>

    <Title title="Device Music" />

    {deviceMusicLoading ? (
      <p>Loading music from your phone...</p>
    ) : deviceMusic.length === 0 ? (
      <p>No music files were found on this device.</p>
    ) : (
      <div className="songList">
        {deviceMusic.map(song => (
          <div className="songRow" key={song.id}>
            <div>
              <b>{song.title || 'Unknown Song'}</b>
              <small>
                {song.artist || 'Unknown Artist'}
                {song.duration ? ` · ${Math.floor(song.duration / 60000)}:${String(Math.floor((song.duration % 60000) / 1000)).padStart(2, '0')}` : ''}
              </small>
            </div>

            <button onClick={() => startSong(song)}>
              ▶
            </button>
          </div>
        ))}
      </div>
    )}
  </>
) : !playlistOpen ? (              <>
                <button
                  className="libraryFolder"
                  onClick={() => setPlaylistOpen(true)}
                >
                  <span className="folderIcon">🎶</span>
                  <span className="folderInfo">
                    <b>My Playlist</b>
                    <small>{playlist.length} {playlist.length === 1 ? 'song' : 'songs'}</small>
                  </span>
                  <span className="folderArrow">›</span>
                </button>

<button
  className="libraryFolder"
  onClick={openDeviceMusic}
>
  <span className="folderIcon">📁</span>
  <span className="folderInfo">
    <b>Device Music</b>
    <small>{deviceMusicOpen ? `${deviceMusic.length} songs` : 'Music on this phone'}</small>
  </span>
  <span className="folderArrow">›</span>
</button>
                <button
                  className="primary"
                  onClick={() => setTab('Home')}
                >
                  Discover Music
                </button>
              </>
            ) : (
              <>
                <button
                  className="backButton"
                  onClick={() => setPlaylistOpen(false)}
                >
                  ← Your Library
                </button>

                <Title title="My Playlist" />

                {playlist.length === 0 ? (
                  <div className="empty">
                    <div>♫</div>
                    <h2>Your playlist is empty.</h2>
                    <p>Add songs from Music World and they will appear here.</p>
                  </div>
                ) : (
                  <div className="chartList">
                    {playlist.map(a => (
                      <div className="row" key={a.rank}>
                        <div className="avatar">{a.name[0]}</div>

                        <div className="meta">
                          <b>{a.song}</b>
                          <small>{a.name} · {a.country}</small>
                        </div>

                        <button onClick={() => startSong(a)}>▶</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'Profile' && !settings && !showSignIn && (
          <>
            <Title title="Profile" />

            {!signedIn ? (
              <div className="profile">
                <div className="bigAvatar">♪</div>
                <h2>Welcome to MUSICWORLD</h2>
                <p>Sign in to manage your Music World account.</p>

                <button
                  className="primary"
                  onClick={() => setShowSignIn(true)}
                >
                  SIGN IN
                </button>

                <button onClick={() => setSettings(true)}>
                  ⚙️ Settings
                </button>
              </div>
            ) : (
              <div className="profile">
                <div className="bigAvatar">♪</div>

                <h2>Your MUSICWORLD profile</h2>
                <p>Music World listener</p>

                <div className="stats">
                  <div>
                    <b>0</b>
                    <small>Followers</small>
                  </div>

                  <div>
                    <b>0</b>
                    <small>Following</small>
                  </div>

                  <div>
                    <b>{playlist.length}</b>
                    <small>Playlists</small>
                  </div>
                </div>

                <button onClick={() => setTab('Library')}>
                  🎶 My Playlist
                </button>

                <button onClick={() => setSettings(true)}>
                  ⚙️ Settings
                </button>

                <button onClick={() => setSignedIn(false)}>
                  Log out
                </button>
              </div>
            )}
          </>
        )}

        {showSignIn && (
          <div className="profile">
            <Title title="Sign In" />

            <div className="accountForm">
              <input
                placeholder="Email address"
                type="email"
              />

              <input
                placeholder="Password"
                type="password"
              />

              <button
                className="primary"
                onClick={() => {
                  setSignedIn(true);
                  setShowSignIn(false);
                }}
              >
                Sign In
              </button>

              <p>
                New to Music World? Account creation will be added next.
              </p>
            </div>
          </div>
        )}

        {settings && (
          <div className="settings">
            <Title title="Settings" />

            <section>
              <h2>Appearance</h2>

              <button onClick={() => setTheme('dark')}>
                🌙 Dark Theme
              </button>

              <button onClick={() => setTheme('light')}>
                ☀️ Light Theme
              </button>

              <button onClick={() => setTheme('pink')}>
                💗 Pink Theme
              </button>

              <button onClick={() => setTheme('red')}>
                ❤️ Red Theme
              </button>

              <button onClick={() => setTheme('blue')}>
                💙 Blue Theme
              </button>

              <button onClick={() => setTheme('midnight')}>
                🌌 Midnight Theme
              </button>
            </section>

<section>
  <h2>Font</h2>

  <button onClick={() => setFont('system')}>
    🔤 System
  </button>

  <button onClick={() => setFont('modern')}>
    ✨ Modern
  </button>

  <button onClick={() => setFont('classic')}>
    📖 Classic
  </button>

  <button onClick={() => setFont('rounded')}>
    🔵 Rounded
  </button>

  <button onClick={() => setFontStyle('normal')}>
    A Normal
  </button>

  <button onClick={() => setFontStyle('italic')}>
    * Italic
  </button>

  <button onClick={() => setFontSize('small')}>
    Small
  </button>

  <button onClick={() => setFontSize('medium')}>
    Medium
  </button>

  <button onClick={() => setFontSize('large')}>
    Large
  </button>

  <button onClick={() => setFontSize('extra-large')}>
    Extra Large
  </button>
</section>

            <section>
              <h2>Account</h2>

              <button>
                🔐 Change Password
              </button>

              <button>
                📧 Account Information
              </button>
            </section>

            <section>
              <h2>Music</h2>

              <button onClick={() => setTab('Library')}>
                🎶 My Playlist
              </button>

              <button>
                📁 Device Music — Coming Soon
              </button>
            </section>

            <section>
              <h2>About</h2>
              <p>A World of Artists. A Standard of Music.</p>
            </section>
          </div>
        )}

      </main>

      {searchOpen && (
        <div className="compactSearch">
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search artists, songs..."
          />

          <div className="searchResults">
            {filteredSearch.map(a => (
              <div className="searchResult" key={a.rank}>
                <button
                  onClick={() => {
                    startSong(a);
                    setSearchOpen(false);
                  }}
                >
                  <span>
                    <b>{a.song}</b>
                    <small>{a.name}</small>
                  </span>
                </button>

                <button onClick={() => addToPlaylist(a)}>
                  ＋
                </button>
              </div>
            ))}

            {filteredSearch.length === 0 && (
              <p>No music found.</p>
            )}
          </div>
        </div>
      )}

      <nav>
        {['Home', 'Discover', 'Charts', 'Library', 'Profile'].map(x => (
          <button
            className={tab === x && !settings && !showSignIn ? 'active' : ''}
            onClick={() => {
              setTab(x);
              setSettings(false);
              setShowSignIn(false);
            }}
            key={x}
          >
            <span>
              {{
                Home: '⌂',
                Discover: '◉',
                Charts: '▥',
                Library: '♫',
                Profile: '●'
              }[x]}
            </span>
            {x}
          </button>
        ))}
      </nav>

      {(settings || showSignIn || searchOpen || expandedPlayer) && (
        <button className="backButton" onClick={goBack}>
          ← Back
        </button>
      )}

      {playing && !expandedPlayer && (
        <div
          className="player"
          onClick={() => setExpandedPlayer(true)}
        >
          <div className="cover">♪</div>

          <div className="pmeta">
            <b>{playing.title || playing.song || 'Unknown Song'}</b>
            <small>{playing.artist || playing.name || 'Unknown Artist'}</small>
          </div>

          <button
            onClick={e => {
              e.stopPropagation();
              setPlaying(null);
            }}
          >
            ✕
          </button>

          <button
            className="play"
            onClick={togglePlayback}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              addToPlaylist(playing);
            }}
          >
            ＋
          </button>
        </div>
      )}

      {playing && expandedPlayer && (
        <div className="fullPlayer">
          <button
            className="minimize"
            onClick={() => setExpandedPlayer(false)}
          >
            ↓
          </button>

          <div className="largeCover">♪</div>

          <p className="eyebrow">NOW PLAYING</p>
          <h1>{playing.title || playing.song || 'Unknown Song'}</h1>
          <p>{playing.artist || playing.name || 'Unknown Artist'}{playing.country ? ` · ${playing.country}` : ''}</p>

          <div className="progress">
            <span style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}></span>
          </div>

          <div className="times">
            <small>{formatTime(currentTime)}</small>
            <small>{formatTime(duration)}</small>
          </div>

          <div className="controls">
            <button>↶</button>
            <button onClick={togglePlayback}>{isPlaying ? "❚❚" : "▶"}</button>
            <button>↷</button>
          </div>

          <button
            className="primary"
            onClick={() => addToPlaylist(playing)}
          >
            ＋ Add to Playlist
          </button>

          <button
            className="closeFull"
            onClick={() => {
              setPlaying(null);
              setExpandedPlayer(false);
            }}
          >
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
