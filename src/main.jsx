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
  const [artistMusicOpen, setArtistMusicOpen] = useState(false);
  const [artistProfileOpen, setArtistProfileOpen] = useState(false);
  const [artistAnalyticsOpen, setArtistAnalyticsOpen] = useState(false);
  const [artistAudienceOpen, setArtistAudienceOpen] = useState(false);
  const [artistEarningsOpen, setArtistEarningsOpen] = useState(false);
const [artistReleaseOpen, setArtistReleaseOpen] = useState(false);
const [artistReleaseStep, setArtistReleaseStep] = useState(1);
const [artistReleaseAudio, setArtistReleaseAudio] = useState(null);
const [artistReleaseArtwork, setArtistReleaseArtwork] = useState(null);

function openArtistSection(section) {
  setArtistMusicOpen(section === 'music');
  setArtistProfileOpen(section === 'profile');
  setArtistAnalyticsOpen(section === 'analytics');
  setArtistAudienceOpen(section === 'audience');
  setArtistEarningsOpen(section === 'earnings');
}
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

    if (artistMusicOpen) {
      setArtistMusicOpen(false);
      return;
    }

    if (artistProfileOpen) {
      setArtistProfileOpen(false);
      return;
    }

    if (artistAnalyticsOpen) {
      setArtistAnalyticsOpen(false);
      return;
    }

    if (artistAudienceOpen) {
      setArtistAudienceOpen(false);
      return;
    }

    if (artistEarningsOpen) {
      setArtistEarningsOpen(false);
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

      {!artistOpen && (
        <header>
          <div className="logo">
            MUSIC<span>WORLD</span>
          </div>

          <button className="search" onClick={() => setSearchOpen(true)}>
            ⌕ <span>Search artists, songs...</span>
          </button>
        </header>
      )}

      <main>

        {tab === 'Home' && !artistOpen && (
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

            <div className="artistDashboardPreview">
              <div className="artistDashboardHeader">
                <div>
                  <span className="artistDashboardLabel">ARTIST STUDIO</span>
                  <h2>Your Music World</h2>
                  <p>Everything you need to build your music journey.</p>
                </div>

                <div className="artistDashboardAvatar">🎤</div>
              </div>

              <div className="artistStatsGrid">
                <div className="artistStatCard">
                  <span>▶</span>
                  <b>0</b>
                  <small>Total Plays</small>
                </div>

                <div className="artistStatCard">
                  <span>👥</span>
                  <b>0</b>
                  <small>Listeners</small>
                </div>

                <div className="artistStatCard">
                  <span>🎵</span>
                  <b>0</b>
                  <small>Releases</small>
                </div>

                <div className="artistStatCard">
                  <span>💰</span>
                  <b>$0.00</b>
                  <small>Earnings</small>
                </div>
              </div>

              <div className="artistDashboardGrid">
                <button
                  className="artistDashboardCard"
                  onClick={() => openArtistSection('music')}
                >
                  <span className="artistDashboardCardIcon">🎵</span>
                  <span>
                    <b>Music</b>
                    <small>Upload and manage your releases.</small>
                  </span>
                  <strong>→</strong>
                </button>

                <button
                  className="artistDashboardCard"
                  onClick={() => openArtistSection('profile')}
                >
                  <span className="artistDashboardCardIcon">👤</span>
                  <span>
                    <b>Artist Profile</b>
                    <small>Build your public artist presence.</small>
                  </span>
                  <strong>→</strong>
                </button>

                <button
                  className="artistDashboardCard"
                  onClick={() => openArtistSection('analytics')}
                >
                  <span className="artistDashboardCardIcon">📊</span>
                  <span>
                    <b>Analytics</b>
                    <small>Understand how your music is performing.</small>
                  </span>
                  <strong>→</strong>
                </button>

                <button
                  className="artistDashboardCard"
                  onClick={() => openArtistSection('audience')}
                >
                  <span className="artistDashboardCardIcon">👥</span>
                  <span>
                    <b>Audience</b>
                    <small>See how listeners discover your music.</small>
                  </span>
                  <strong>→</strong>
                </button>

                <button
                  className="artistDashboardCard"
                  onClick={() => openArtistSection('earnings')}
                >
                  <span className="artistDashboardCardIcon">💰</span>
                  <span>
                    <b>Earnings</b>
                    <small>Track future royalties and revenue.</small>
                  </span>
                  <strong>→</strong>
                </button>
              </div>

              <div className="artistDashboardNotice">
                <span>✦</span>
                <div>
                  <b>Your artist journey starts here.</b>
                  <small>
                    Music uploads, analytics, audience insights and earnings
                    will become available as the artist system is connected.
                  </small>
                </div>
              </div>
            </div>
          </section>
        )}

        {artistEarningsOpen && (
  <section className="artistEarningsStudio">
    <div className="artistEarningsHeader">
      <button
        className="artistBack"
        onClick={() => setArtistEarningsOpen(false)}
      >
        ← Artist Dashboard
      </button>

      <span className="artistDashboardLabel">ARTIST STUDIO</span>
      <h1>Earnings</h1>
      <p>
        Track future royalties and revenue from your Music World releases.
      </p>
    </div>

    <div className="artistEarningsHero">
      <div>
        <span className="artistEarningsLabel">AVAILABLE EARNINGS</span>
        <strong>$0.00</strong>
        <small>No earnings available yet</small>
      </div>

      <div className="artistEarningsIcon">💰</div>
    </div>

    <div className="artistEarningsStats">
      <div>
        <span>💵</span>
        <b>$0.00</b>
        <small>Total Earnings</small>
      </div>

      <div>
        <span>⏳</span>
        <b>$0.00</b>
        <small>Pending</small>
      </div>

      <div>
        <span>🎵</span>
        <b>0</b>
        <small>Releases</small>
      </div>

      <div>
        <span>▶</span>
        <b>0</b>
        <small>Plays</small>
      </div>
    </div>

    <div className="artistEarningsSection">
      <div className="artistEarningsSectionTitle">
        <div>
          <h2>Revenue Overview</h2>
          <small>Your Music World earnings activity</small>
        </div>
      </div>

      <div className="artistRevenueChart">
        <div className="artistRevenueBars">
          <span style={{ height: '12%' }}></span>
          <span style={{ height: '20%' }}></span>
          <span style={{ height: '9%' }}></span>
          <span style={{ height: '16%' }}></span>
          <span style={{ height: '25%' }}></span>
          <span style={{ height: '14%' }}></span>
          <span style={{ height: '18%' }}></span>
        </div>

        <div className="artistRevenueEmpty">
          <b>No revenue data yet</b>
          <small>
            Earnings activity will appear once your releases begin
            generating eligible revenue.
          </small>
        </div>
      </div>
    </div>

    <div className="artistEarningsSection">
      <div className="artistEarningsSectionTitle">
        <div>
          <h2>Payment Information</h2>
          <small>Manage future payout details</small>
        </div>
      </div>

      <div className="artistPaymentCard">
        <span>🏦</span>
        <div>
          <b>Payment method</b>
          <small>No payment method connected</small>
        </div>
        <strong>→</strong>
      </div>
    </div>

    <div className="artistEarningsNotice">
      <span>✦</span>
      <div>
        <b>Earnings will activate with the artist system.</b>
        <small>
          Revenue tracking, royalty calculations and payout management
          will be connected when Music World artist accounts and
          distribution are implemented.
        </small>
      </div>
    </div>
  </section>
)}

{artistAudienceOpen && (
  <section className="artistAudienceStudio">
    <div className="artistAudienceHeader">
      <button
        className="artistBack"
        onClick={() => setArtistAudienceOpen(false)}
      >
        ← Artist Dashboard
      </button>

      <span className="artistDashboardLabel">ARTIST STUDIO</span>
      <h1>Audience</h1>
      <p>
        Learn where your listeners come from and how they discover your music.
      </p>
    </div>

    <div className="artistAudienceStats">
      <div>
        <span>👥</span>
        <b>0</b>
        <small>Total Listeners</small>
      </div>

      <div>
        <span>↗</span>
        <b>0%</b>
        <small>Growth</small>
      </div>

      <div>
        <span>▶</span>
        <b>0</b>
        <small>Total Plays</small>
      </div>

      <div>
        <span>🌍</span>
        <b>0</b>
        <small>Countries</small>
      </div>
    </div>

    <div className="artistAudienceCard">
      <div className="artistAudienceCardHeader">
        <div>
          <h2>Listener Growth</h2>
          <small>Audience over time</small>
        </div>
        <span>0 listeners</span>
      </div>

      <div className="artistAudienceGraph">
        <div className="artistAudienceGraphLines"></div>

        <div className="artistAudienceEmpty">
          <span>👥</span>
          <b>No audience data yet</b>
          <small>
            Listener growth will appear here after your music starts
            reaching people.
          </small>
        </div>
      </div>
    </div>

    <div className="artistAudienceSection">
      <div className="artistAudienceSectionTitle">
        <div>
          <h2>Top Countries</h2>
          <small>Where your listeners are located</small>
        </div>
      </div>

      <div className="artistAudienceList">
        <div>
          <span className="artistAudienceFlag">🌍</span>
          <div>
            <b>No listener data yet</b>
            <small>Countries will appear as your audience grows.</small>
          </div>
          <strong>—</strong>
        </div>
      </div>
    </div>

    <div className="artistAudienceSection">
      <div className="artistAudienceSectionTitle">
        <div>
          <h2>How Listeners Discover You</h2>
          <small>Music World discovery sources</small>
        </div>
      </div>

      <div className="artistDiscoveryGrid">
        <div>
          <span>🔎</span>
          <b>Search</b>
          <small>0 listeners</small>
        </div>

        <div>
          <span>🎵</span>
          <b>Music</b>
          <small>0 listeners</small>
        </div>

        <div>
          <span>📈</span>
          <b>Charts</b>
          <small>0 listeners</small>
        </div>

        <div>
          <span>✨</span>
          <b>Discover</b>
          <small>0 listeners</small>
        </div>
      </div>
    </div>

    <div className="artistAudienceNotice">
      <span>✦</span>
      <div>
        <b>Your audience will grow with your music.</b>
        <small>
          Listener locations, discovery sources and audience trends
          will become available once the artist system is connected.
        </small>
      </div>
    </div>
  </section>
)}

{artistAnalyticsOpen && (
  <section className="artistAnalyticsStudio">
    <div className="artistAnalyticsHeader">
      <button
        className="artistBack"
        onClick={() => setArtistAnalyticsOpen(false)}
      >
        ← Artist Dashboard
      </button>

      <span className="artistDashboardLabel">ARTIST STUDIO</span>
      <h1>Analytics</h1>
      <p>
        Understand how listeners discover and engage with your music.
      </p>
    </div>

    <div className="artistAnalyticsRange">
      <button className="artistAnalyticsRangeActive">Overview</button>
      <button>7 Days</button>
      <button>30 Days</button>
      <button>All Time</button>
    </div>

    <div className="artistAnalyticsStats">
      <div>
        <span>▶</span>
        <b>0</b>
        <small>Total Plays</small>
      </div>

      <div>
        <span>👥</span>
        <b>0</b>
        <small>Listeners</small>
      </div>

      <div>
        <span>⏱</span>
        <b>0</b>
        <small>Listening Time</small>
      </div>

      <div>
        <span>🎵</span>
        <b>0</b>
        <small>Releases</small>
      </div>
    </div>

    <div className="artistAnalyticsChart">
      <div className="artistAnalyticsChartHeader">
        <div>
          <h2>Music Performance</h2>
          <small>Plays over time</small>
        </div>
        <span>0 plays</span>
      </div>

      <div className="artistAnalyticsGraph">
        <div className="artistGraphLine lineOne"></div>
        <div className="artistGraphLine lineTwo"></div>
        <div className="artistGraphLine lineThree"></div>

        <div className="artistGraphEmpty">
          <span>📈</span>
          <b>No data yet</b>
          <small>
            Your performance data will appear after your music
            starts reaching listeners.
          </small>
        </div>
      </div>
    </div>

    <div className="artistAnalyticsSection">
      <div className="artistAnalyticsSectionTitle">
        <div>
          <h2>Top Releases</h2>
          <small>Your most-played music</small>
        </div>
      </div>

      <div className="artistAnalyticsEmpty">
        <span>🎵</span>
        <div>
          <b>No releases yet</b>
          <small>Upload music to start tracking performance.</small>
        </div>
      </div>
    </div>

    <div className="artistAnalyticsSection">
      <div className="artistAnalyticsSectionTitle">
        <div>
          <h2>Listener Insights</h2>
          <small>Understand your audience</small>
        </div>
      </div>

      <div className="artistInsightGrid">
        <div>
          <span>🌍</span>
          <b>Top Countries</b>
          <small>No listener data yet</small>
        </div>

        <div>
          <span>📱</span>
          <b>Discovery</b>
          <small>No discovery data yet</small>
        </div>

        <div>
          <span>❤️</span>
          <b>Engagement</b>
          <small>No engagement data yet</small>
        </div>
      </div>
    </div>

    <div className="artistAnalyticsNotice">
      <span>✦</span>
      <div>
        <b>Analytics will grow with your music.</b>
        <small>
          Real-time plays, listener insights and performance trends
          will become available once the artist music system is connected.
        </small>
      </div>
    </div>
  </section>
)}

{artistProfileOpen && (
  <section className="artistProfileStudio">
    <div className="artistProfileHeader">
      <button
        className="artistBack"
        onClick={() => setArtistProfileOpen(false)}
      >
        ← Artist Dashboard
      </button>

      <span className="artistDashboardLabel">ARTIST STUDIO</span>
      <h1>Artist Profile</h1>
      <p>
        Build the public identity listeners will see on Music World.
      </p>
    </div>

    <div className="artistProfilePreview">
      <div className="artistProfileAvatar">🎤</div>

      <div className="artistProfileIdentity">
        <span className="artistProfileTag">ARTIST</span>
        <h2>Your Artist Name</h2>
        <p>Your country • Your genre</p>
      </div>

      <button
        className="artistProfileEdit"
        onClick={() => alert(
          'Profile editing will be connected to the artist account system next.'
        )}
      >
        Edit Profile
      </button>
    </div>

    <div className="artistProfileSection">
      <div className="artistProfileSectionTitle">
        <div>
          <h2>Public Profile</h2>
          <small>How listeners discover you</small>
        </div>
      </div>

      <div className="artistProfileFields">
        <div>
          <span>Artist Name</span>
          <b>Your Artist Name</b>
        </div>

        <div>
          <span>Genre</span>
          <b>Not set yet</b>
        </div>

        <div>
          <span>Country</span>
          <b>Not set yet</b>
        </div>

        <div>
          <span>Bio</span>
          <b>Add your artist story</b>
        </div>
      </div>
    </div>

    <div className="artistProfileSection">
      <div className="artistProfileSectionTitle">
        <div>
          <h2>Artist Presence</h2>
          <small>Complete your public identity</small>
        </div>
      </div>

      <div className="artistProfileChecklist">
        <div>
          <span>○</span>
          <b>Artist photo</b>
          <small>Add a recognizable profile image.</small>
        </div>

        <div>
          <span>○</span>
          <b>Artist bio</b>
          <small>Tell listeners your story and sound.</small>
        </div>

        <div>
          <span>○</span>
          <b>Genre & country</b>
          <small>Help listeners understand your music.</small>
        </div>

        <div>
          <span>○</span>
          <b>Social links</b>
          <small>Connect your other music platforms.</small>
        </div>
      </div>
    </div>

    <div className="artistProfileNotice">
      <span>✦</span>
      <div>
        <b>Your artist identity starts here.</b>
        <small>
          Profile editing, verification and public artist pages will
          be connected when the artist account system is added.
        </small>
      </div>
    </div>
  </section>
)}

{artistReleaseOpen && (
  <section className="artistReleaseStudio">
    <div className="artistReleaseHeader">
      <button
        className="artistBack"
        onClick={() => setArtistReleaseOpen(false)}
      >
        ← Music Studio
      </button>

      <span className="artistDashboardLabel">ARTIST STUDIO</span>
      <h1>New Release</h1>
      <p>Set up your release before sending your music to listeners.</p>
    </div>

    <div className="artistReleaseCard">
      <div className="artistReleaseStep">
        <span>1</span>
        <div>
          <b>Release details</b>
          <small>Tell us about your music.</small>
        </div>
      </div>

      <label>
        Release title
        <input
          type="text"
          placeholder="Enter your song or release title"
        />
      </label>

      <label>
        Artist name
        <input
          type="text"
          placeholder="Your artist name"
        />
      </label>

      <label>
        Release type
        <select defaultValue="Single">
          <option>Single</option>
          <option>EP</option>
          <option>Album</option>
        </select>
      </label>

      <label>
        Genre
        <select defaultValue="">
          <option value="" disabled>Select a genre</option>
          <option>Afrobeats</option>
          <option>Amapiano</option>
          <option>Hip-Hop</option>
          <option>R&B</option>
          <option>Pop</option>
          <option>Gospel</option>
          <option>Other</option>
        </select>
      </label>

      <div className="artistReleaseArtwork">
        {artistReleaseArtwork?.uri ? (
          <img
            src={artistReleaseArtwork.uri}
            alt="Selected cover artwork"
            className="artistArtworkPreview"
          />
        ) : (
          <span>🖼️</span>
        )}
        <div>
          <b>Cover artwork</b>
          <small>
            {artistReleaseArtwork?.name || 'Add artwork for your release.'}
          </small>
        </div>
        <button
          type="button"
          className="artistSecondaryButton"
          onClick={async () => {
            try {
              const result = await DeviceMusic.pickArtwork();
              if (result?.uri) {
                setArtistReleaseArtwork(result);
              } else {
                alert('No artwork was selected.');
              }
            } catch (error) {
              alert('Unable to select artwork.\n\nDetails: ' + (error?.message || String(error)));
            }
          }}
        >
          {artistReleaseArtwork ? 'Change Artwork' : 'Add Artwork'}
        </button>
      </div>

      <div className="artistReleaseAudio">
        <span>🎵</span>
        <div>
          <b>Audio file</b>
          <small>
            {artistReleaseAudio
              ? `${artistReleaseAudio.title || 'Selected audio'}${artistReleaseAudio.artist ? ' • ' + artistReleaseAudio.artist : ''}`
              : 'Select the music file you want to release.'}
          </small>
        </div>
        <button
          type="button"
          className="primary"
          onClick={async () => {
          try {
            const result = await DeviceMusic.pickAudio();
            const selected = result?.songs?.[0] || null;
            setArtistReleaseAudio(selected);

            if (!selected) {
              alert('No music file was selected.');
            }
          } catch (error) {
            alert('Unable to select music file.\n\nDetails: ' + (error?.message || String(error)));
          }
        }}
        >
          {artistReleaseAudio ? 'Change Music' : 'Select Music'}
        </button>
      </div>

      {artistReleaseStep === 2 && (
        <div className="artistReleaseReview">
          <div className="artistReleaseStep">
            <span>2</span>
            <div>
              <b>Review release</b>
              <small>Check your release details before submitting.</small>
            </div>
          </div>

          <div className="artistReleaseReviewItem">
            <b>Release</b>
            <span>Review the title, artist name, genre and selected media.</span>
          </div>

          <div className="artistReleaseReviewItem">
            <b>Audio</b>
            <span>{artistReleaseAudio?.title || 'No audio selected'}</span>
          </div>

          <div className="artistReleaseReviewItem">
            <b>Artwork</b>
            <span>{artistReleaseArtwork?.name || 'No artwork selected'}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        className="primary artistReleaseContinue"
        onClick={() => {
          if (artistReleaseStep < 2) {
            setArtistReleaseStep(2);
            return;
          }

          if (!artistReleaseAudio) {
            alert('Please select an audio file before submitting.');
            return;
          }

          if (!artistReleaseArtwork) {
            alert('Please add cover artwork before submitting.');
            return;
          }

          alert('Release is ready for submission. The upload system will be connected next.');
        }}
      >
        {artistReleaseStep === 1 ? 'Continue →' : 'Submit Release'}
      </button>
    </div>

    <div className="artistReleaseNotice">
      <span>✦</span>
      <div>
        <b>Release setup</b>
        <small>
          Your information will be used to prepare your music for Music World.
          Nothing is published yet.
        </small>
      </div>
    </div>
  </section>
)}

{artistMusicOpen && (
          <section className="artistMusicStudio">
            <div className="artistMusicHeader">
              <button
                className="artistBack"
                onClick={() => setArtistMusicOpen(false)}
              >
                ← Artist Dashboard
              </button>

              <span className="artistDashboardLabel">ARTIST STUDIO</span>
              <h1>Music</h1>
              <p>Manage your releases and build your catalog on Music World.</p>
            </div>

            <div className="artistMusicHero">
              <div>
                <span className="artistMusicSmallLabel">YOUR CATALOG</span>
                <h2>Ready for your first release?</h2>
                <p>
                  Upload your music, add release details and prepare your
                  songs for listeners around the world.
                </p>
              </div>

              <button
                className="primary artistUploadButton"
                onClick={() => setArtistReleaseOpen(true)}
              >
                ＋ Upload Music
              </button>
            </div>

            <div className="artistMusicSectionTitle">
              <div>
                <h2>Your Releases</h2>
                <small>0 releases</small>
              </div>
            </div>

            <div className="artistEmptyMusic">
              <div className="artistEmptyMusicIcon">🎵</div>
              <h3>No releases yet</h3>
              <p>
                Your published songs and releases will appear here once
                your artist music system is connected.
              </p>

              <button
                className="artistSecondaryButton"
                onClick={() => setArtistReleaseOpen(true)}
              >
                Start Your First Release
              </button>
            </div>

            <div className="artistMusicFeatures">
              <div>
                <span>🎼</span>
                <b>Releases</b>
                <small>Manage singles and albums.</small>
              </div>

              <div>
                <span>📝</span>
                <b>Details</b>
                <small>Add artwork, titles and metadata.</small>
              </div>

              <div>
                <span>🌍</span>
                <b>Distribution</b>
                <small>Prepare music for Music World listeners.</small>
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

      {!artistOpen && (
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
              setArtistMusicOpen(false);
              setArtistProfileOpen(false);
              setArtistAnalyticsOpen(false);
              setArtistAudienceOpen(false);
              setArtistEarningsOpen(false);
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
      )}

      {(settings || showSignIn || searchOpen || expandedPlayer || artistOpen || artistMusicOpen || artistProfileOpen || artistAnalyticsOpen || artistAudienceOpen || artistEarningsOpen) && (
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
