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
  const [artistOpen, setArtistOpen] = useState(false);
  const [artistAuth, setArtistAuth] = useState(null);
  const [settings, setSettings] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [font, setFont] = useState('system');
  const [fontStyle, setFontStyle] = useState('normal');
  const [fontSize, setFontSize] = useState('medium'); 
  const [deviceMusic, setDeviceMusic] = useState([]);
  const [deviceMusicOpen, setDeviceMusicOpen] = useState(false);
  const [deviceMusicLoading, setDeviceMusicLoading] = useState(false);
  const [deviceMusicSearch, setDeviceMusicSearch] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [addSongsOpen, setAddSongsOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);

  useEffect(() => {
    try {
      const savedPlaylists = localStorage.getItem('musicWorldPlaylists');

      if (savedPlaylists) {
        const parsed = JSON.parse(savedPlaylists);

        if (Array.isArray(parsed)) {
          setPlaylists(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'musicWorldPlaylists',
        JSON.stringify(playlists)
      );
    } catch (error) {
      console.error('Failed to save playlists:', error);
    }
  }, [playlists]);

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

  const filteredDeviceMusic = useMemo(() => {
    const q = deviceMusicSearch.trim().toLowerCase();

    if (!q) return deviceMusic;

    return deviceMusic.filter(song =>
      `${song.title || ''} ${song.artist || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [deviceMusic, deviceMusicSearch]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font', font);
    document.documentElement.setAttribute('data-font-style', fontStyle);
    document.documentElement.setAttribute('data-font-size', fontSize);
}, [font, fontStyle, fontSize]);
  useEffect(() => {
    if (!playing?.uri) return;

    let timer;

    const updateNativePlayback = async () => {
      try {
        const state = await DeviceMusic.getPlaybackState();

        const nextTime = Number(state.currentTime);
        const nextDuration = Number(state.duration);

        if (Number.isFinite(nextTime) && nextTime >= 0) {
          setCurrentTime(nextTime);
        }

        if (Number.isFinite(nextDuration) && nextDuration > 0) {
          setDuration(nextDuration);
        }

        setIsPlaying(Boolean(state.isPlaying));

        if (
          Number.isFinite(nextDuration) &&
          nextDuration > 0 &&
          Number.isFinite(nextTime) &&
          nextTime >= nextDuration
        ) {
          setCurrentTime(nextDuration);
          setIsPlaying(false);

          const currentIndex = deviceMusic.findIndex(
            song => song?.uri === playing?.uri
          );

          if (currentIndex >= 0 && currentIndex < deviceMusic.length - 1) {
            const nextSong = deviceMusic[currentIndex + 1];
            await startSong(nextSong);
          }
        }
      } catch (error) {
        console.error("Playback state error:", error);
      }
    };

    updateNativePlayback();
    timer = setInterval(updateNativePlayback, 500);

    return () => {
      clearInterval(timer);
    };
  }, [playing?.uri]);

  async function seekFromProgress(event) {
  if (!playing?.uri || !duration || !Number.isFinite(duration)) return;

  const rect = event.currentTarget.getBoundingClientRect();
  const clientX = event.clientX;

  if (clientX == null) return;

  const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const position = percent * duration;

  setCurrentTime(position);

  try {
    await DeviceMusic.seekTo({ position });
  } catch (error) {
    console.error("Seek error:", error);
  }
}

function formatTime(ms) {
    if (!ms || !Number.isFinite(ms)) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }


  async function startSong(song, keepExpanded = false) {
    setPlaying(song);

    if (!keepExpanded) {
      setExpandedPlayer(false);
    }
    setCurrentTime(0);
    setDuration(song?.duration || 0);

    if (song?.uri) {
      try {
        await DeviceMusic.play({ uri: song.uri, title: song.title, artist: song.artist, album: song.album });
        setIsPlaying(true);
      } catch (error) {
        setIsPlaying(false);
        console.error("Native audio playback error:", error);
        alert("Unable to play this song.\\n\\nDetails: " + (error?.message || String(error)));
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

  async function playNext(e) {
    if (e) e.stopPropagation();

    if (!playing?.uri || !deviceMusic.length) return;

    const currentIndex = deviceMusic.findIndex(
      song => song?.uri === playing?.uri
    );

    if (currentIndex >= 0 && currentIndex < deviceMusic.length - 1) {
      await startSong(deviceMusic[currentIndex + 1], true);
    }
  }

  async function playPrevious(e) {
    if (e) e.stopPropagation();

    if (!playing?.uri || !deviceMusic.length) return;

    if (currentTime > 3000) {
      try {
        await DeviceMusic.seekTo({ position: 0 });
        setCurrentTime(0);
      } catch (error) {
        console.error("Previous seek error:", error);
      }
      return;
    }

    const currentIndex = deviceMusic.findIndex(
      song => song?.uri === playing?.uri
    );

    if (currentIndex > 0) {
      await startSong(deviceMusic[currentIndex - 1], true);
    }
  }
  function openPlaylistPicker(song) {
    if (!song) return;

    if (playlists.length === 0) {
      const name = window.prompt("Enter playlist name:");

      if (name && name.trim()) {
        const newPlaylist = {
          id: Date.now().toString(),
          name: name.trim(),
          songs: [song]
        };

        setPlaylists(current => [...current, newPlaylist]);
        setActivePlaylistId(newPlaylist.id);
      }

      return;
    }

    setPlaylistPickerOpen(true);
  }

  function addToPlaylist(song) {
    if (!song) return;

    setPlaylists(currentPlaylists => {
      if (currentPlaylists.length === 0) {
        const newPlaylist = {
          id: Date.now().toString(),
          name: 'My Playlist',
          songs: [song]
        };

        setActivePlaylistId(newPlaylist.id);
        return [newPlaylist];
      }

      const targetId = activePlaylistId || currentPlaylists[0].id;

      return currentPlaylists.map(pl => {
        if (pl.id !== targetId) return pl;

        const alreadyAdded = pl.songs.some(
          item => item?.uri === song?.uri || item?.id === song?.id
        );

        if (alreadyAdded) return pl;

        return {
          ...pl,
          songs: [...pl.songs, song]
        };
      });
    });
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

    if (artistOpen) {
      setArtistOpen(false);
      setArtistAuth(null);
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
              <div className="aiMusicCard">
                <div className="aiMusicGlow"></div>

                <div className="aiMusicIcon">✦</div>

                <div className="aiMusicContent">
                  <div className="aiMusicLabel">MUSIC WORLD AI</div>
                  <b>Create beyond the ordinary.</b>
                  <p>
                    Explore AI-generated, AI-assisted and experimental music
                    made for a new generation of sound.
                  </p>

                  <button
                    className="aiMusicButton"
                    onClick={() => setTab('Charts')}
                  >
                    Explore AI Music <span>→</span>
                  </button>
                </div>
              </div>
            </Section>

            <Section title="For Artists">
              <div className="forArtistsCard">
                <div className="forArtistsIcon">🎤</div>

                <div className="forArtistsContent">
                  <b>Build your music career</b>
                  <p>
                    Join Music World as an artist. Create your artist profile,
                    manage your music and reach listeners around the world.
                  </p>

                  <button
                    className="primary"
                    onClick={() => {
                      setArtistOpen(true);
                      setArtistAuth(null);
                    }}
                  >
                    Enter For Artists →
                  </button>
                </div>
              </div>
            </Section>
          </>
        )}

        {artistOpen && (
          <section className="artistPortal">
            <div className="artistPortalHero">
              <div className="artistPortalIcon">🎤</div>
              <p className="eyebrow">MUSIC WORLD FOR ARTISTS</p>
              <h1>Turn your music<br /><em>into a journey.</em></h1>
              <p className="sub">
                Create your artist presence, manage your music and connect
                with listeners through Music World.
              </p>
            </div>

            {!artistAuth ? (
              <div className="artistAuthChoices">
                <button
                  className="artistAuthCard"
                  onClick={() => setArtistAuth('signin')}
                >
                  <span className="artistAuthIcon">→</span>
                  <span>
                    <b>Artist Sign In</b>
                    <small>Already have an artist account?</small>
                  </span>
                </button>

                <button
                  className="artistAuthCard"
                  onClick={() => setArtistAuth('create')}
                >
                  <span className="artistAuthIcon">＋</span>
                  <span>
                    <b>Create Artist Account</b>
                    <small>Start your journey on Music World.</small>
                  </span>
                </button>
              </div>
            ) : (
              <div className="artistAuthPanel">
                <button
                  className="artistBack"
                  onClick={() => setArtistAuth(null)}
                >
                  ← For Artists
                </button>

                <h2>
                  {artistAuth === 'signin'
                    ? 'Artist Sign In'
                    : 'Create Artist Account'}
                </h2>

                <p>
                  {artistAuth === 'signin'
                    ? 'Sign in to manage your Music World artist profile.'
                    : 'Create your artist account and start building your presence.'}
                </p>

                <label>
                  Email
                  <input type="email" placeholder="artist@email.com" />
                </label>

                <label>
                  Password
                  <input type="password" placeholder="Enter password" />
                </label>

                {artistAuth === 'create' && (
                  <label>
                    Artist Name
                    <input type="text" placeholder="Your artist name" />
                  </label>
                )}

                <button
                  className="primary artistContinue"
                  onClick={() => alert(
                    artistAuth === 'signin'
                      ? 'Artist sign in will be connected to the Music World account system next.'
                      : 'Artist account creation will be connected to the Music World account system next.'
                  )}
                >
                  {artistAuth === 'signin'
                    ? 'Sign In'
                    : 'Create Artist Account'}
                </button>
              </div>
            )}

            <div className="artistFuture">
              <b>Coming to the Artist Dashboard</b>
              <div className="artistFutureGrid">
                <span>🎵 Music</span>
                <span>👤 Profile</span>
                <span>📊 Analytics</span>
                <span>👥 Audience</span>
              </div>
            </div>
          </section>
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

    <div className="deviceMusicHeader">
      <p className="deviceMusicSubtitle">Songs stored on your phone</p>

      <div className="deviceMusicSearch">
        <span>⌕</span>
        <input
          type="search"
          placeholder="Search your music..."
          value={deviceMusicSearch}
          onChange={e => setDeviceMusicSearch(e.target.value)}
        />
        {deviceMusicSearch && (
          <button
            className="clearDeviceSearch"
            onClick={() => setDeviceMusicSearch('')}
            aria-label="Clear music search"
          >
            ✕
          </button>
        )}
      </div>
    </div>

    {deviceMusicLoading ? (
      <p>Loading music from your phone...</p>
    ) : deviceMusic.length === 0 ? (
      <p>No music files were found on this device.</p>
    ) : (
      filteredDeviceMusic.length === 0 ? (
        <p className="noMusicResults">No matching songs found.</p>
      ) : (
      <div className="songList">
        {filteredDeviceMusic.map(song => {
          const isCurrentSong = playing?.uri === song?.uri;

          return (
            <div
              className={`songRow ${isCurrentSong ? 'playingSong' : ''}`}
              key={song.id}
              onClick={() => startSong(song)}
              role="button"
              tabIndex="0"
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  startSong(song);
                }
              }}
            >
              <div className="songArtwork">
                {isCurrentSong && isPlaying ? '🔊' : '♪'}
              </div>

              <div className="songInfo">
                <b>{song.title || 'Unknown Song'}</b>
                <small>
                  {song.artist || 'Unknown Artist'}
                  {song.duration ? ` · ${Math.floor(song.duration / 60000)}:${String(Math.floor((song.duration % 60000) / 1000)).padStart(2, '0')}` : ''}
                </small>
              </div>

              <span className="songPlayIcon">
                {isCurrentSong && isPlaying ? '❚❚' : '▶'}
              </span>
            </div>
          );
        })}
      </div>
      )
    )}
  </>
) : !playlistOpen ? (
              <>
                <Title title="Playlists" />

                <button
                  className="primary"
                  onClick={() => {
                    const name = window.prompt("Enter playlist name:");

                    if (name && name.trim()) {
                      const newPlaylist = {
                        id: Date.now().toString(),
                        name: name.trim(),
                        songs: []
                      };

                      setPlaylists(current => [...current, newPlaylist]);
                    }
                  }}
                >
                  ＋ Create Playlist
                </button>

                {playlists.length === 0 ? (
                  <div className="empty">
                    <div>♫</div>
                    <h2>No playlists yet.</h2>
                    <p>Create a playlist and start adding your music.</p>
                  </div>
                ) : (
                  <div className="playlistGrid">
                    {playlists.map(pl => (
                      <button
                        className="playlistCard"
                        key={pl.id}
                        onClick={() => {
                          setActivePlaylistId(pl.id);
                          setPlaylistOpen(true);
                        }}
                      >
                        <span className="playlistCardIcon">🎶</span>

                        <span className="playlistCardInfo">
                          <b>{pl.name}</b>
                          <small>
                            {pl.songs.length} {pl.songs.length === 1 ? 'song' : 'songs'}
                          </small>
                        </span>

                        <span className="folderArrow">›</span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  className="libraryFolder"
                  onClick={openDeviceMusic}
                >
                  <span className="folderIcon">📁</span>
                  <span className="folderInfo">
                    <b>Device Music</b>
                    <small>Music on this phone</small>
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
                  onClick={() => {
                    setPlaylistOpen(false);
                    setAddSongsOpen(false);
                  }}
                >
                  ← Playlists
                </button>

                {(() => {
                  const activePlaylist = playlists.find(
                    pl => pl.id === activePlaylistId
                  );

                  if (!activePlaylist) {
                    return (
                      <div className="empty">
                        <div>♫</div>
                        <h2>Playlist not found.</h2>
                      </div>
                    );
                  }

                  return (
                    <>
                      <Title title={activePlaylist.name} />

                      <div className="playlistActions">
                        <button
                          onClick={() => {
                            const name = window.prompt(
                              "Rename playlist:",
                              activePlaylist.name
                            );

                            if (name && name.trim()) {
                              setPlaylists(current =>
                                current.map(pl =>
                                  pl.id === activePlaylist.id
                                    ? { ...pl, name: name.trim() }
                                    : pl
                                )
                              );
                            }
                          }}
                        >
                          ✏️ Rename
                        </button>

                        <button
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Delete "${activePlaylist.name}"?`
                            );

                            if (!confirmed) return;

                            setPlaylists(current =>
                              current.filter(
                                pl => pl.id !== activePlaylist.id
                              )
                            );

                            setActivePlaylistId(null);
                            setPlaylistOpen(false);
                            setAddSongsOpen(false);
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>

                      <button
                        className="primary"
                        onClick={() => setAddSongsOpen(!addSongsOpen)}
                      >
                        ＋ Add Songs to Playlist
                      </button>

                      {addSongsOpen && (
                        <div className="playlistAddPanel">
                          <h3>Select Songs</h3>

                          {deviceMusic.length === 0 ? (
                            <p>No songs found on this device.</p>
                          ) : (
                            <div className="playlistSongPicker">
                              {deviceMusic.map(song => {
                                const alreadyAdded = activePlaylist.songs.some(
                                  item =>
                                    item?.uri === song?.uri ||
                                    item?.id === song?.id
                                );

                                return (
                                  <button
                                    className="playlistPickerRow"
                                    key={song.id || song.uri}
                                    disabled={alreadyAdded}
                                    onClick={() => {
                                      setPlaylists(current =>
                                        current.map(pl => {
                                          if (pl.id !== activePlaylist.id) return pl;

                                          if (
                                            pl.songs.some(
                                              item =>
                                                item?.uri === song?.uri ||
                                                item?.id === song?.id
                                            )
                                          ) {
                                            return pl;
                                          }

                                          return {
                                            ...pl,
                                            songs: [...pl.songs, song]
                                          };
                                        })
                                      );
                                    }}
                                  >
                                    <span className="songArtwork">♪</span>

                                    <span className="songInfo">
                                      <b>{song.title || 'Unknown Song'}</b>
                                      <small>
                                        {song.artist || 'Unknown Artist'}
                                      </small>
                                    </span>

                                    <span>
                                      {alreadyAdded ? '✓' : '＋'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {activePlaylist.songs.length === 0 ? (
                        <div className="empty">
                          <div>♫</div>
                          <h2>This playlist is empty.</h2>
                          <p>Add songs from your phone using the button above.</p>
                        </div>
                      ) : (
                        <div className="playlistSongList">
                          {activePlaylist.songs.map(song => (
                            <div
                              className="playlistSongRow"
                              key={song.id || song.uri}
                              onClick={() => startSong(song)}
                            >
                              <div className="songArtwork">♪</div>

                              <div className="songInfo">
                                <b>{song.title || 'Unknown Song'}</b>
                                <small>
                                  {song.artist || 'Unknown Artist'}
                                </small>
                              </div>

                              <button
                                onClick={e => {
                                  e.stopPropagation();

                                  setPlaylists(current =>
                                    current.map(pl => {
                                      if (pl.id !== activePlaylist.id) return pl;

                                      return {
                                        ...pl,
                                        songs: pl.songs.filter(
                                          item =>
                                            item?.uri !== song?.uri &&
                                            item?.id !== song?.id
                                        )
                                      };
                                    })
                                  );
                                }}
                                aria-label="Remove song"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
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
                    <b>{playlists.length}</b>
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

      {playlistPickerOpen && playing && (
        <div className="playlistPickerOverlay">
          <div className="playlistPicker">
            <div className="playlistPickerHeader">
              <h2>Add to Playlist</h2>

              <button
                onClick={() => setPlaylistPickerOpen(false)}
                aria-label="Close playlist picker"
              >
                ✕
              </button>
            </div>

            <p>
              {playing.title || playing.song || 'Current song'}
            </p>

            <div className="playlistPickerList">
              {playlists.map(pl => {
                const alreadyAdded = pl.songs.some(
                  item =>
                    item?.uri === playing?.uri ||
                    item?.id === playing?.id
                );

                return (
                  <button
                    key={pl.id}
                    disabled={alreadyAdded}
                    onClick={() => {
                      setPlaylists(current =>
                        current.map(item => {
                          if (item.id !== pl.id) return item;

                          if (
                            item.songs.some(
                              song =>
                                song?.uri === playing?.uri ||
                                song?.id === playing?.id
                            )
                          ) {
                            return item;
                          }

                          return {
                            ...item,
                            songs: [...item.songs, playing]
                          };
                        })
                      );

                      setPlaylistPickerOpen(false);
                    }}
                  >
                    <span className="playlistCardIcon">🎶</span>

                    <span className="playlistCardInfo">
                      <b>{pl.name}</b>
                      <small>
                        {pl.songs.length} {pl.songs.length === 1 ? 'song' : 'songs'}
                      </small>
                    </span>

                    <span>
                      {alreadyAdded ? '✓' : '＋'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              className="primary"
              onClick={() => {
                const name = window.prompt("Enter playlist name:");

                if (name && name.trim()) {
                  const newPlaylist = {
                    id: Date.now().toString(),
                    name: name.trim(),
                    songs: [playing]
                  };

                  setPlaylists(current => [...current, newPlaylist]);
                  setActivePlaylistId(newPlaylist.id);
                  setPlaylistPickerOpen(false);
                }
              }}
            >
              ＋ Create New Playlist
            </button>
          </div>
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

      <nav className="bottomNav">
        {['Home', 'Discover', 'Charts', 'Library', 'Profile'].map(x => (
          <button
            className={`navItem ${tab === x && !settings && !showSignIn ? 'active' : ''}`}
            onClick={() => {
              setTab(x);
              setSettings(false);
              setShowSignIn(false);
              setArtistOpen(false);
              setArtistAuth(null);
            }}
            key={x}
          >
            <span className="navIcon">
              {{
                Home: '⌂',
                Discover: '◉',
                Charts: '▥',
                Library: '♫',
                Profile: '●'
              }[x]}
            </span>
            <span className="navLabel">{x}</span>
          </button>
        ))}
      </nav>

      {(settings || showSignIn || searchOpen || expandedPlayer || artistOpen) && (
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
            onClick={async e => {
              e.stopPropagation();

              try {
                await DeviceMusic.stop();
              } catch (error) {
                console.error("Stop playback error:", error);
              }

              setPlaying(null);
              setIsPlaying(false);
              setCurrentTime(0);
              setDuration(0);
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
              openPlaylistPicker(playing);
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

          <div
            className="progress"
            onPointerDown={seekFromProgress}
            role="slider"
            aria-label="Song progress"
            aria-valuemin="0"
            aria-valuemax={duration || 0}
            aria-valuenow={currentTime}
          >
            <span style={{ width: `${duration ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%` }}></span>
          </div>

          <div className="times">
            <small>{formatTime(currentTime)}</small>
            <small>{formatTime(duration)}</small>
          </div>

          <div className="controls">
            <button className="skipButton" onClick={playPrevious} aria-label="Previous song">⏮</button>
            <button className="playButton" onClick={togglePlayback} aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <button className="skipButton" onClick={playNext} aria-label="Next song">⏭</button>
          </div>

          <button
            className="primary"
            onClick={() => openPlaylistPicker(playing)}
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
