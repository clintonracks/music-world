import { supabase } from './supabase';
import { App as CapacitorApp } from '@capacitor/app';
import { Filesystem } from '@capacitor/filesystem';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { registerPlugin } from '@capacitor/core';
import './styles.css';

async function testSupabaseConnection() {
  const { error } = await supabase.auth.getSession();

  if (error) {
    console.error('Supabase connection test failed:', error.message);
    return false;
  }

  console.log('Supabase connection test passed.');
  return true;
}

testSupabaseConnection();


const DeviceMusic = registerPlugin('DeviceMusic');

async function copySelectedFileToCache(uri) {
  if (!uri) {
    throw new Error('No file URI provided.');
  }

  const result = await DeviceMusic.copyFileToCache({ uri });

  if (!result?.path) {
    throw new Error('The selected file could not be prepared for upload.');
  }

  return result;
}	
async function uploadCachedFile(cachePath, objectPath, contentType) {
  if (!cachePath) {
    throw new Error('No cached file is available for upload.');
  }

  const file = await Filesystem.readFile({
    path: cachePath
  });

  if (!file?.data) {
    throw new Error('Unable to read the cached file.');
  }

  const byteCharacters = atob(file.data);
  const byteNumbers = new Uint8Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const blob = new Blob([byteNumbers], {
    type: contentType || 'application/octet-stream'
  });

  const { data, error } = await supabase.storage
    .from('music')
    .upload(objectPath, blob, {
      contentType: contentType || 'application/octet-stream',
      upsert: false
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

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
  const [navigationStack, setNavigationStack] = useState(['Home']);

  function navigateTo(screen) {
    setNavigationStack(prev => [...prev, screen]);
  }

  function navigateBack() {
    setNavigationStack(prev => {
      if (prev.length <= 1) return prev;

      return prev.slice(0, -1);
    });
  }
  const [playing, setPlaying] = useState(null);
  const [expandedPlayer, setExpandedPlayer] = useState(false);
  const audioRef = useRef(null);
  const playbackIdRef = useRef(null);
  const streamRecordedRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chart, setChart] = useState('Africa');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [listenerName, setListenerName] = useState('');
  const [listenerEmail, setListenerEmail] = useState('');
  const [listenerPassword, setListenerPassword] = useState('');
  const [listenerAuthLoading, setListenerAuthLoading] = useState(false);
  const [listenerAuthError, setListenerAuthError] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [listenerAuthMode, setListenerAuthMode] = useState('signin');
  const [artistOpen, setArtistOpen] = useState(false);
  const [artistAuth, setArtistAuth] = useState(null);
  const [artistAccount, setArtistAccount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('musicWorldArtistAccount') || 'null');
    } catch {
      return null;
    }
  });
  const [artistAuthEmail, setArtistAuthEmail] = useState('');
  const [artistAuthPassword, setArtistAuthPassword] = useState('');
  const [artistAuthName, setArtistAuthName] = useState('');

  useEffect(() => {
    const handleAuthUrl = ({ url }) => {
      if (!url || !url.startsWith('musicworld://auth/callback')) {
        return;
      }

      const hash = url.split('#')[1] || '';
      const params = new URLSearchParams(hash);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
      }
    };

    CapacitorApp.addListener('appUrlOpen', handleAuthUrl);

    return () => {
      CapacitorApp.removeAllListeners('appUrlOpen');
    };
  }, []);

  useEffect(() => {
    if (!artistAccount?.id) {
      setArtistFollowerCount(0);
      return;
    }

    const loadArtistFollowers = async () => {
      const { count, error } = await supabase
        .from('artist_followers')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', artistAccount.id);

      if (error) {
        console.error('Unable to load artist followers:', error.message);
        return;
      }

      setArtistFollowerCount(count || 0);
    };

    loadArtistFollowers();
  }, [artistAccount?.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session;
      const user = session?.user;

      setSignedIn(Boolean(session));

      if (user) {
        setArtistAccount({
          id: user.id,
          email: user.email || '',
          artistName: user.user_metadata?.artistName || 'Music World Artist',
          createdAt: user.created_at || new Date().toISOString(),
          verified: user.user_metadata?.accountType === 'artist'
        });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;

        setSignedIn(Boolean(session));

        if (user) {
          setArtistAccount({
            id: user.id,
            email: user.email || '',
            artistName: user.user_metadata?.artistName || 'Music World Artist',
            createdAt: user.created_at || new Date().toISOString(),
            verified: user.user_metadata?.accountType === 'artist'
          });
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);


  const [artistProfile, setArtistProfile] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('musicWorldArtistProfile') || '{}'
      );
    } catch {
      return {};
    }
  });

  const [artistProfileEditOpen, setArtistProfileEditOpen] = useState(false);
  const [artistProfileName, setArtistProfileName] = useState('');
  const [artistProfileGenre, setArtistProfileGenre] = useState('');
  const [artistProfileCountry, setArtistProfileCountry] = useState('');
  const [artistProfileBio, setArtistProfileBio] = useState('');
  const [artistFollowerCount, setArtistFollowerCount] = useState(0);
  const [artistFollowing, setArtistFollowing] = useState(false);

  const [artistMusicOpen, setArtistMusicOpen] = useState(false);
  const [artistProfileOpen, setArtistProfileOpen] = useState(false);
  const [publicArtistOpen, setPublicArtistOpen] = useState(false);
  const [publicArtist, setPublicArtist] = useState(null);
  const [publicArtistTab, setPublicArtistTab] = useState('Music');
  const [pendingFollowArtist, setPendingFollowArtist] = useState(null);
  const [artistAnalyticsOpen, setArtistAnalyticsOpen] = useState(false);
  const [artistAnalyticsRange, setArtistAnalyticsRange] = useState('Overview');
  const [artistAudienceOpen, setArtistAudienceOpen] = useState(false);
  const [artistEarningsOpen, setArtistEarningsOpen] = useState(false);
const [artistReleaseOpen, setArtistReleaseOpen] = useState(false);
const [artistReleaseStep, setArtistReleaseStep] = useState(1);
const [artistReleaseAudio, setArtistReleaseAudio] = useState(null);
const [artistReleaseArtwork, setArtistReleaseArtwork] = useState(null);
const [artistReleasePublishing, setArtistReleasePublishing] = useState(false);
const [artistReleases, setArtistReleases] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('musicWorldArtistReleases') || '[]');
  } catch {
    return [];
  }
});
const [artistReleaseTitle, setArtistReleaseTitle] = useState('');
const [artistReleaseArtist, setArtistReleaseArtist] = useState('');
const [artistReleaseType, setArtistReleaseType] = useState('Single');
const [artistReleaseGenre, setArtistReleaseGenre] = useState('');

const [artistReleaseDraft, setArtistReleaseDraft] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem('musicWorldArtistReleaseDraft') || 'null'
    );
  } catch {
    return null;
  }
});


useEffect(() => {
  const hasDraft =
    artistReleaseTitle.trim() ||
    artistReleaseArtist.trim() ||
    artistReleaseGenre ||
    artistReleaseAudio ||
    artistReleaseArtwork;

  if (!hasDraft) {
    return;
  }

  const draft = {
    title: artistReleaseTitle,
    artist: artistReleaseArtist,
    type: artistReleaseType,
    genre: artistReleaseGenre,
    audio: artistReleaseAudio,
    artwork: artistReleaseArtwork,
    step: artistReleaseStep,
    savedAt: new Date().toISOString()
  };

  setArtistReleaseDraft(draft);
  localStorage.setItem(
    'musicWorldArtistReleaseDraft',
    JSON.stringify(draft)
  );
}, [
  artistReleaseTitle,
  artistReleaseArtist,
  artistReleaseType,
  artistReleaseGenre,
  artistReleaseAudio,
  artistReleaseArtwork,
  artistReleaseStep
]);


function openPlayingArtist() {
  if (!playing) return;

  setExpandedPlayer(false);

  openPublicArtist({
    id: playing.artist_id || playing.artistId || '',
    name: playing.artist || playing.artistName || 'Unknown Artist',
    artistName: playing.artist || playing.artistName || 'Unknown Artist',
    country: playing.country || '',
    genre: playing.genre || '',
    bio: playing.bio || '',
    artwork: playing.artistArtwork || playing.artwork || '',
    releases: []
  });
}

async function openPublicArtist(artist) {
  if (!artist) return;

  const publicArtistData = {
    ...artist,
    monthlyListeners: artist.monthlyListeners || artist.listeners || 0,
    verified: artist.verified === true,
    releases: artist.releases || []
  };

  setPublicArtist(publicArtistData);
  setPublicArtistOpen(true);
  navigateTo('ArtistProfile');
  setArtistOpen(false);
  setArtistProfileOpen(false);
  setArtistMusicOpen(false);
  setArtistAnalyticsOpen(false);
  setArtistAudienceOpen(false);
  setArtistEarningsOpen(false);

  const artistId = artist.id;

  if (!artistId) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const releases = await Promise.all(
      (data || []).map(async (song) => {
        let artworkUrl = null;

        if (song.artwork_url) {
          const { data: artworkData } =
            await supabase.storage
              .from('music')
              .createSignedUrl(song.artwork_url, 3600);

          artworkUrl = artworkData?.signedUrl || null;
        }

        return {
          ...song,
          title: song.title,
          artist: song.artist,
          genre: song.genre,
          artwork: artworkUrl,
          status: 'Published'
        };
      })
    );

    setPublicArtist(current => (
      current
        ? { ...current, releases }
        : current
    ));
  } catch (error) {
    console.error(
      'Unable to load public artist releases:',
      error.message
    );
  }
}

function openArtistSection(section) {
  setArtistMusicOpen(section === 'music');
  setArtistProfileOpen(section === 'profile');
  setArtistAnalyticsOpen(section === 'analytics');
  setArtistAudienceOpen(section === 'audience');
  setArtistEarningsOpen(section === 'earnings');
}
  const [settings, setSettings] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
const [accountInfoOpen, setAccountInfoOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [theme, setTheme] = useState('dark');
  const [font, setFont] = useState('system');
  const [fontStyle, setFontStyle] = useState('normal');
  const [fontSize, setFontSize] = useState('medium'); 
  const [deviceMusic, setDeviceMusic] = useState([]);
  const [deviceMusicOpen, setDeviceMusicOpen] = useState(false);
  const [deviceMusicLoading, setDeviceMusicLoading] = useState(false);
  const [deviceMusicSearch, setDeviceMusicSearch] = useState('');
  const [onlineSongs, setOnlineSongs] = useState([]);
const [offlineSongs, setOfflineSongs] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem('musicWorldOfflineSongs') || '[]'
    );
  } catch {
    return [];
  }
});
  const [onlineMusicLoading, setOnlineMusicLoading] = useState(false);
const [offlineMusicLoading, setOfflineMusicLoading] = useState(false);
  const [offlineMusicOpen, setOfflineMusicOpen] = useState(false);

  async function downloadSongForOffline(song) {
  if (!song?.audioUrl || !song?.id) {
    throw new Error('This song is not available for offline download.');
  }

  setOfflineMusicLoading(true);

  try {
    const response = await fetch(song.audioUrl);

    if (!response.ok) {
      throw new Error('Unable to download the song.');
    }

    const blob = await response.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(
        new Error('Unable to prepare the song for offline storage.')
      );

      reader.readAsDataURL(blob);
    });

    const base64 = dataUrl.split(',')[1];

    const fileName =
      `${song.id}-${(song.title || 'song')
        .replace(/[^a-zA-Z0-9._-]/g, '_')}.mp3`;

    await Filesystem.writeFile({
      path: `offline/${fileName}`,
      data: base64,
      directory: 'DATA',
      recursive: true
    });

    const offlineSong = {
      ...song,
      offlineFileName: fileName,
      downloadedAt: new Date().toISOString()
    };

    const updated = [
      ...offlineSongs.filter(item => item.id !== song.id),
      offlineSong
    ];

    setOfflineSongs(updated);

    localStorage.setItem(
      'musicWorldOfflineSongs',
      JSON.stringify(updated)
    );

    alert('Downloaded for offline listening.');
  } catch (error) {
    console.error('Offline download error:', error);

    alert(
      'Unable to download this song.\n\nDetails: ' +
      (error?.message || String(error))
    );
  } finally {
    setOfflineMusicLoading(false);
  }
}

async function loadOnlineSongs() {
    setOnlineMusicLoading(true);

    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const songsWithUrls = await Promise.all(
        (data || []).map(async (song) => {
          let audioUrl = null;
          let artworkUrl = null;

          if (song.audio_url) {
            const { data: audioData, error: audioError } =
              await supabase.storage
                .from('music')
                .createSignedUrl(song.audio_url, 3600);

            if (audioError) {
              throw new Error(`Audio signed URL error: ${audioError.message}`);
            }

            audioUrl = audioData?.signedUrl || null;
          }

          if (song.artwork_url) {
            const { data: artworkData } =
              await supabase.storage
                .from('music')
                .createSignedUrl(song.artwork_url, 3600);

            artworkUrl = artworkData?.signedUrl || null;
          }

          return {
            ...song,
            audioUrl,
            artworkUrl
          };
        })
      );

      setOnlineSongs(songsWithUrls);
    } catch (error) {
      console.error('Unable to load online songs:', error);
    } finally {
      setOnlineMusicLoading(false);
    }
  }

  useEffect(() => {
    loadOnlineSongs();
  }, []);


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

    const artistResults = artists
      .filter(a =>
        !q ||
        `${a.name} ${a.song}`
          .toLowerCase()
          .includes(q)
      )
      .map(a => ({
        ...a,
        searchType: 'artist'
      }));

    const onlineSongResults = onlineSongs
      .filter(song =>
        !q ||
        `${song.title || ''} ${song.artist || ''}`
          .toLowerCase()
          .includes(q)
      )
      .map(song => ({
        ...song,
        name: song.artist || 'Unknown Artist',
        song: song.title || 'Unknown Song',
        searchType: 'online'
      }));

    return [...artistResults, ...onlineSongResults];
  }, [search, onlineSongs]);

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
          nextTime >= 10 &&
          playbackIdRef.current &&
          streamRecordedRef.current !== playbackIdRef.current
        ) {
          const artistId = playing.artist_id || playing.artistId || '';

          if (artistId) {
            try {
              const { data: { user } } = await supabase.auth.getUser();

              if (user?.id) {
                const { error: streamError } = await supabase
                  .from('streams')
                  .insert({
                    artist_id: artistId,
                    playback_id: playbackIdRef.current,
                    listener_id: user.id
                  });

                if (streamError) {
                  console.error('Stream recording error:', streamError.message);
                } else {
                  streamRecordedRef.current = playbackIdRef.current;
                  console.log('Stream recorded:', playbackIdRef.current);
                }
              }
            } catch (error) {
              console.error('Stream recording error:', error);
            }
          }
        }

        if (
          Number.isFinite(nextDuration) &&
          nextDuration > 0 &&
          Number.isFinite(nextTime) &&
          nextTime >= nextDuration
        ) {
          setCurrentTime(nextDuration);

          if (repeatMode === 'one') {
            try {
              await DeviceMusic.seekTo({ position: 0 });
              setCurrentTime(0);
              await DeviceMusic.resume();
              setIsPlaying(true);
            } catch (error) {
              console.error("Repeat one error:", error);
              setIsPlaying(false);
            }
            return;
          }

          setIsPlaying(false);

          await playNext();
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
  }, [playing?.uri, repeatMode, shuffleEnabled]);

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


  async function playOfflineSong(song, keepExpanded = false) {
    if (!song?.offlineFileName) {
      throw new Error('This offline song is not available.');
    }

    try {
      const result = await Filesystem.getUri({
        path: `offline/${song.offlineFileName}`,
        directory: 'DATA'
      });

      if (!result?.uri) {
        throw new Error('Unable to access the offline song.');
      }

      await startSong(
        {
          ...song,
          uri: result.uri,
          artwork: song.artworkUrl || song.artwork
        },
        keepExpanded
      );
    } catch (error) {
      console.error('Offline playback error:', error);
      alert(
        'Unable to play this offline song.\n\nDetails: ' +
        (error?.message || String(error))
      );
    }
  }

  async function startSong(song, keepExpanded = false) {
    const playbackId = crypto.randomUUID();
    playbackIdRef.current = playbackId;
    streamRecordedRef.current = null;

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

    if (!playing?.uri) return;

    const isOnlineSong = onlineSongs.some(
      song => song?.audioUrl === playing?.uri
    );

    const currentList = isOnlineSong ? onlineSongs : deviceMusic;

    if (!currentList.length) return;

    const currentIndex = currentList.findIndex(song =>
      isOnlineSong
        ? song?.audioUrl === playing?.uri
        : song?.uri === playing?.uri
    );

    if (currentIndex < 0) return;

    let nextIndex;

    if (shuffleEnabled && currentList.length > 1) {
      const availableIndexes = currentList
        .map((_, index) => index)
        .filter(index => index !== currentIndex);

      nextIndex =
        availableIndexes[
          Math.floor(Math.random() * availableIndexes.length)
        ];
    } else if (currentIndex < currentList.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (repeatMode === 'all') {
      nextIndex = 0;
    } else {
      return;
    }

    const nextSong = currentList[nextIndex];

    if (isOnlineSong) {
      await startSong({
        ...nextSong,
        uri: nextSong.audioUrl,
        title: nextSong.title,
        artist: nextSong.artist,
        album: nextSong.genre || 'Music World',
        artwork: nextSong.artworkUrl
      }, true);
    } else {
      await startSong(nextSong, true);
    }
  }

  async function playPrevious(e) {
    if (e) e.stopPropagation();

    if (!playing?.uri) return;

    if (currentTime > 3000) {
      try {
        await DeviceMusic.seekTo({ position: 0 });
        setCurrentTime(0);
      } catch (error) {
        console.error("Previous seek error:", error);
      }
      return;
    }

    const isOnlineSong = onlineSongs.some(
      song => song?.audioUrl === playing?.uri
    );

    const currentList = isOnlineSong ? onlineSongs : deviceMusic;

    if (!currentList.length) return;

    const currentIndex = currentList.findIndex(song =>
      isOnlineSong
        ? song?.audioUrl === playing?.uri
        : song?.uri === playing?.uri
    );

    if (currentIndex > 0) {
      const previousSong = currentList[currentIndex - 1];

      if (isOnlineSong) {
        await startSong({
          ...previousSong,
          uri: previousSong.audioUrl,
          title: previousSong.title,
          artist: previousSong.artist,
          album: previousSong.genre || 'Music World',
          artwork: previousSong.artworkUrl
        }, true);
      } else {
        await startSong(previousSong, true);
      }
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
    if (publicArtistOpen) {
      if (navigationStack.length > 1) {
        const previousScreen = navigationStack[navigationStack.length - 2];

        setNavigationStack(prev => prev.slice(0, -1));
        setPublicArtistOpen(false);
        setPublicArtist(null);

        if (['Home', 'Discover', 'Charts', 'Library', 'Profile'].includes(previousScreen)) {
          setTab(previousScreen);
        }

        return;
      }

      setPublicArtistOpen(false);
      setPublicArtist(null);
      return;
    }

    if (navigationStack.length > 1) {
      const previousScreen = navigationStack[navigationStack.length - 2];

      navigateBack();

      if (previousScreen === 'ArtistProfile') {
        setPublicArtistOpen(true);
        return;
      }
    }

    if (accountInfoOpen) {
      setAccountInfoOpen(false);
      return;
    }

    if (expandedPlayer) {
      setExpandedPlayer(false);
      return;
    }

    if (searchOpen) {
      setSearchOpen(false);
      return;
    }

    if (changePasswordOpen) {
      setChangePasswordOpen(false);
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

    if (artistProfileEditOpen) {
      setArtistProfileEditOpen(false);
      return;
    }

    if (artistReleaseOpen) {
      setArtistReleaseOpen(false);
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

      {!artistOpen && !publicArtistOpen && (
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

            <Section
              title="Global Top 10"
              action="View all"
              onAction={() => setTab('Charts')}
            >
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

            {!artistAuth && !artistAccount ? (
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
                  <input
      type="email"
      placeholder="artist@email.com"
      value={artistAuthEmail}
      onChange={(e) => setArtistAuthEmail(e.target.value)}
    />
                </label>

                <label>
                  Password
                  <input
      type="password"
      placeholder="Enter password"
      value={artistAuthPassword}
      onChange={(e) => setArtistAuthPassword(e.target.value)}
    />
                </label>

                {artistAuth === 'create' && (
                  <label>
                    Artist Name
                    <input
  type="text"
  placeholder="Your artist name"
  value={artistAuthName}
  onChange={(e) => setArtistAuthName(e.target.value)}
/>
                  </label>
                )}

                <button
                  className="primary artistContinue"
                  onClick={async () => {
                    const email = artistAuthEmail.trim().toLowerCase();
                    const password = artistAuthPassword;
                    const name = artistAuthName.trim();

                    if (!email || !password) {
                      alert('Please enter your email and password.');
                      return;
                    }

                    if (artistAuth === 'create') {
                      if (!name) {
                        alert('Please enter your artist name.');
                        return;
                      }

                      if (password.length < 6) {
                        alert('Password must be at least 6 characters.');
                        return;
                      }

                      const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                          emailRedirectTo: 'musicworld://auth/callback',
                          data: {
                            artistName: name,
                            accountType: 'artist'
                          }
                        }
                      });

                      if (error) {
                        alert(error.message);
                        return;
                      }

                      const user = data?.user;

                      if (!user) {
                        alert('Account creation could not be completed.');
                        return;
                      }

                      const account = {
                        id: user.id,
                        email: user.email || email,
                        artistName: name,
                        createdAt: user.created_at || new Date().toISOString(),
                        verified: true
                      };

                      setArtistAccount(account);
                      setArtistAuthEmail('');
                      setArtistAuthPassword('');
                      setArtistAuthName('');
                      setArtistAuth(null);

                      alert(
                        data.session
                          ? 'Artist account created successfully.'
                          : 'Artist account created. Please check your email to confirm your account.'
                      );
                      return;
                    }

                    const { data, error } =
                      await supabase.auth.signInWithPassword({
                        email,
                        password
                      });

                    if (error) {
                      alert(error.message);
                      return;
                    }

                    const user = data?.user;

                    if (!user) {
                      alert('Artist sign in could not be completed.');
                      return;
                    }

                    setArtistAccount({
                      id: user.id,
                      email: user.email || email,
                      artistName:
                        user.user_metadata?.artistName ||
                        'Music World Artist',
                      createdAt:
                        user.created_at ||
                        new Date().toISOString(),
                      verified: true
                    });

                    setArtistAuthEmail('');
                    setArtistAuthPassword('');
                    setArtistAuth(null);

                    alert('Artist sign in successful.');
                  }}
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
                  <h2>{artistAccount?.artistName || 'Your Music World'}</h2>
                  <p>
                    {artistAccount?.email
                      ? artistAccount.email
                      : 'Everything you need to build your music journey.'}
                  </p>
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
      {['Overview', '7 Days', '30 Days', 'All Time'].map((range) => (
        <button
          key={range}
          className={artistAnalyticsRange === range ? 'artistAnalyticsRangeActive' : ''}
          onClick={() => setArtistAnalyticsRange(range)}
        >
          {range}
        </button>
      ))}
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

    <div
  className="artistProfilePreview"
  onClick={() => openPublicArtist({
    ...artistProfile,
    id: artistProfile.id || artistAccount?.id,
    name: artistProfile.name || artistAccount?.artistName || 'Artist',
    artistName: artistProfile.name || artistAccount?.artistName || 'Artist',
    verified: artistAccount?.verified === true,
    monthlyListeners: artistProfile.monthlyListeners || 0
  })}
  role="button"
  tabIndex="0"
  onKeyDown={e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.currentTarget.click();
    }
  }}
>
      <div className="artistProfileAvatar">🎤</div>

      <div className="artistProfileIdentity">
        <span className="artistProfileTag">ARTIST</span>
        <h2>{artistProfile.name || artistAccount?.artistName || 'Your Artist Name'}</h2>
        <p>
          {artistProfile.country || 'Country not set'}
          {' • '}
          {artistProfile.genre || 'Genre not set'}
        </p>
      </div>

      <button
        className="artistProfileEdit"
        onClick={() => {
          setArtistProfileName(
            artistProfile.name || artistAccount?.artistName || ''
          );
          setArtistProfileGenre(artistProfile.genre || '');
          setArtistProfileCountry(artistProfile.country || '');
          setArtistProfileBio(artistProfile.bio || '');
          setArtistProfileEditOpen(true);
        }}
      >
        Edit Profile
      </button>
    </div>

    {artistProfileEditOpen ? (
      <div className="artistProfileSection">
        <div className="artistProfileSectionTitle">
          <div>
            <h2>Edit Profile</h2>
            <small>Update your public artist identity</small>
          </div>
        </div>

        <div className="artistProfileFields">
          <label>
            Artist Name
            <input
              type="text"
              value={artistProfileName}
              onChange={(e) => setArtistProfileName(e.target.value)}
              placeholder="Your artist name"
            />
          </label>

          <label>
            Genre
            <input
              type="text"
              value={artistProfileGenre}
              onChange={(e) => setArtistProfileGenre(e.target.value)}
              placeholder="Afrobeats, Amapiano, Hip-Hop..."
            />
          </label>

          <label>
            Country
            <input
              type="text"
              value={artistProfileCountry}
              onChange={(e) => setArtistProfileCountry(e.target.value)}
              placeholder="Your country"
            />
          </label>

          <label>
            Bio
            <textarea
              value={artistProfileBio}
              onChange={(e) => setArtistProfileBio(e.target.value)}
              placeholder="Tell listeners about yourself and your music..."
              rows="5"
            />
          </label>
        </div>

        <div className="artistProfileActions">
          <button
            className="artistBack"
            onClick={() => setArtistProfileEditOpen(false)}
          >
            Cancel
          </button>

          <button
            className="primary"
            onClick={async () => {
              const name = artistProfileName.trim();

              if (!name) {
                alert('Please enter your artist name.');
                return;
              }

              if (!artistAccount?.id) {
                alert('Please sign in to your artist account first.');
                return;
              }

              const profile = {
                name,
                genre: artistProfileGenre.trim(),
                country: artistProfileCountry.trim(),
                bio: artistProfileBio.trim(),
                updatedAt: new Date().toISOString()
              };

              const { error } = await supabase
                .from('artist_profiles')
                .upsert({
                  id: artistAccount.id,
                  name: profile.name,
                  genre: profile.genre,
                  country: profile.country,
                  bio: profile.bio,
                  updated_at: profile.updatedAt
                });

              if (error) {
                console.error('Artist profile save error:', error.message);
                alert('Unable to save your artist profile.\\n\\nDetails: ' + error.message);
                return;
              }

              setArtistProfile(profile);
              localStorage.setItem(
                'musicWorldArtistProfile',
                JSON.stringify(profile)
              );

              setArtistProfileEditOpen(false);
              alert('Artist profile updated successfully.');
            }}
          >
            Save Profile
          </button>
        </div>
      </div>
    ) : null}

    {!artistProfileEditOpen && (
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
          <b>{artistProfile.name || artistAccount?.artistName || 'Not set yet'}</b>
        </div>

        <div>
          <span>Genre</span>
          <b>{artistProfile.genre || 'Not set yet'}</b>
        </div>

        <div>
          <span>Country</span>
          <b>{artistProfile.country || 'Not set yet'}</b>
        </div>

        <div>
          <span>Bio</span>
          <b>{artistProfile.bio || 'Add your artist story'}</b>
        </div>
      </div>
    </div>
    )}

    {!artistProfileEditOpen && (
    <div className="artistProfileSection">
      <div className="artistProfileSectionTitle">
        <div>
          <h2>Audience</h2>
          <small>Your Music World audience</small>
        </div>
      </div>

      <div className="artistAudienceStats">
        <div className="artistAudienceStat">
          <strong>{artistFollowerCount}</strong>
          <span>Followers</span>
        </div>
        <div className="artistAudienceStat">
          <strong>0</strong>
          <span>Listeners</span>
        </div>
        <div className="artistAudienceStat">
          <strong>0</strong>
          <span>Streams</span>
        </div>
      </div>
    </div>
    )}

    {!artistProfileEditOpen && (
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
    )}

    {!artistProfileEditOpen && (
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
    )}
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
          value={artistReleaseTitle}
          onChange={(e) => setArtistReleaseTitle(e.target.value)}
        />
      </label>

      <label>
        Artist name
        <input
          type="text"
          placeholder="Your artist name"
          value={artistReleaseArtist}
          onChange={(e) => setArtistReleaseArtist(e.target.value)}
        />
      </label>

      <label>
        Release type
        <select
  value={artistReleaseType}
  onChange={(e) => setArtistReleaseType(e.target.value)}
>
          <option>Single</option>
          <option>EP</option>
          <option>Album</option>
        </select>
      </label>

      <label>
        Genre
        <select
  value={artistReleaseGenre}
  onChange={(e) => setArtistReleaseGenre(e.target.value)}
>
          <option value="" disabled>Select a genre</option>
          <optgroup label="African Music">
            <option>Afrobeats</option>
            <option>Afro-Piano</option>
            <option>Amapiano</option>
            <option>Afro-pop</option>
            <option>Afro-house</option>
            <option>Afro-fusion</option>
            <option>Afro-soul</option>
            <option>Highlife</option>
            <option>Hiplife</option>
            <option>Dancehall</option>
            <option>Reggae</option>
            <option>Traditional/Cultural</option>
          </optgroup>

          <optgroup label="Hip-Hop & Rap">
            <option>Hip-Hop</option>
            <option>Rap</option>
            <option>Trap</option>
            <option>Drill</option>
          </optgroup>

          <optgroup label="Pop & Alternative">
            <option>Pop</option>
            <option>Alternative</option>
            <option>Indie</option>
            <option>Rock</option>
          </optgroup>

          <optgroup label="R&B & Soul">
            <option>R&B</option>
            <option>Soul</option>
          </optgroup>

          <optgroup label="Gospel & Inspirational">
            <option>Gospel</option>
            <option>Spoken Word</option>
          </optgroup>

          <optgroup label="Electronic & Dance">
            <option>Electronic/EDM</option>
            <option>House</option>
            <option>Deep House</option>
            <option>Techno</option>
            <option>Dance</option>
          </optgroup>

          <optgroup label="Acoustic & Instrumental">
            <option>Lo-fi</option>
            <option>Instrumental</option>
            <option>Acoustic</option>
          </optgroup>

          <optgroup label="Jazz & Blues">
            <option>Jazz</option>
            <option>Blues</option>
          </optgroup>

          <optgroup label="Country & Folk">
            <option>Country</option>
            <option>Folk</option>
          </optgroup>

          <optgroup label="Classical">
            <option>Classical</option>
          </optgroup>

          <optgroup label="Asian Music">
            <option>K-Pop</option>
            <option>J-Pop</option>
          </optgroup>

          <optgroup label="Latin Music">
            <option>Latin</option>
            <option>Reggaeton</option>
          </optgroup>

          <optgroup label="Other">
            <option>Other</option>
          </optgroup>
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

              if (!result?.uri) {
                alert('No artwork was selected.');
                return;
              }

              const cached = await copySelectedFileToCache(result.uri);

              setArtistReleaseArtwork({
                ...result,
                cachePath: cached.path,
                cacheName: cached.name
              });
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

            if (!selected) {
              alert('No music file was selected.');
              return;
            }

            const cached = await copySelectedFileToCache(selected.uri);

            setArtistReleaseAudio({
              ...selected,
              cachePath: cached.path,
              cacheName: cached.name
            });
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
        onClick={async () => {
          if (artistReleaseStep < 2) {
            setArtistReleaseStep(2);
            return;
          }

          if (artistReleasePublishing) {
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

          if (!artistReleaseTitle.trim()) {
            alert('Please enter a release title.');
            return;
          }

          if (!artistReleaseArtist.trim()) {
            alert('Please enter your artist name.');
            return;
          }

          if (!artistReleaseGenre) {
            alert('Please select a genre.');
            return;
          }

          try {
            setArtistReleasePublishing(true);

            const { data: sessionData, error: sessionError } =
              await supabase.auth.getSession();

            if (sessionError) {
              throw new Error(sessionError.message);
            }

            const user = sessionData?.session?.user;

            if (!user) {
              alert('Please sign in to your artist account first.');
              return;
            }

            if (user.user_metadata?.accountType !== 'artist') {
              alert('Please sign in with a Music World artist account to publish music.');
              return;
            }

            if (!artistReleaseAudio.cachePath) {
              throw new Error('The selected audio file is not ready for upload.');
            }

            if (!artistReleaseArtwork.cachePath) {
              throw new Error('The selected artwork is not ready for upload.');
            }

            const timestamp = Date.now();

            const audioName =
              artistReleaseAudio.cacheName ||
              artistReleaseAudio.title ||
              'audio-file';

            const artworkName =
              artistReleaseArtwork.cacheName ||
              artistReleaseArtwork.name ||
              'artwork-file';

            const safeAudioName = audioName.replace(
              /[^a-zA-Z0-9._-]/g,
              '_'
            );

            const safeArtworkName = artworkName.replace(
              /[^a-zA-Z0-9._-]/g,
              '_'
            );

            const audioPath =
              `${user.id}/audio/${timestamp}-${safeAudioName}`;

            const artworkPath =
              `${user.id}/artwork/${timestamp}-${safeArtworkName}`;

            await uploadCachedFile(
              artistReleaseAudio.cachePath,
              audioPath,
              artistReleaseAudio.mimeType || 'audio/mpeg'
            );

            await uploadCachedFile(
              artistReleaseArtwork.cachePath,
              artworkPath,
              artistReleaseArtwork.mimeType || 'image/jpeg'
            );

            const { data: song, error: songError } =
              await supabase
                .from('songs')
                .insert({
                  title: artistReleaseTitle.trim(),
                  artist: artistReleaseArtist.trim(),
                  genre: artistReleaseGenre,
                  audio_url: audioPath,
                  artwork_url: artworkPath,
                  artist_id: user.id
                })
                .select()
                .single();

            if (songError) {
              throw new Error(songError.message);
            }

            const newRelease = {
              id: song.id,
              title: song.title,
              artist: song.artist,
              type: artistReleaseType,
              genre: song.genre,
              audio: artistReleaseAudio,
              artwork: artistReleaseArtwork,
              audioPath,
              artworkPath,
              status: 'Published',
              createdAt: song.created_at
            };

            const updatedReleases = [newRelease, ...artistReleases];
            setArtistReleases(updatedReleases);

            localStorage.setItem(
              'musicWorldArtistReleases',
              JSON.stringify(updatedReleases)
            );

            localStorage.removeItem('musicWorldArtistReleaseDraft');
            setArtistReleaseDraft(null);

            setArtistReleaseTitle('');
            setArtistReleaseArtist('');
            setArtistReleaseType('Single');
            setArtistReleaseGenre('');
            setArtistReleaseAudio(null);
            setArtistReleaseArtwork(null);
            setArtistReleaseStep(1);
            setArtistReleaseOpen(false);
            setArtistMusicOpen(true);

            alert('Release uploaded successfully.');
          } catch (error) {
            alert(
              'Unable to upload release.\n\nDetails: ' +
              (error?.message || String(error))
            );
          } finally {
            setArtistReleasePublishing(false);
          }
        }}
        disabled={artistReleasePublishing}
      >
        {artistReleasePublishing
          ? 'Publishing...'
          : artistReleaseStep === 1
            ? 'Continue →'
            : 'Submit Release'}
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
                onClick={() => {
                  if (artistReleaseDraft) {
                    setArtistReleaseTitle(artistReleaseDraft.title || '');
                    setArtistReleaseArtist(artistReleaseDraft.artist || '');
                    setArtistReleaseType(artistReleaseDraft.type || 'Single');
                    setArtistReleaseGenre(artistReleaseDraft.genre || '');
                    setArtistReleaseAudio(artistReleaseDraft.audio || null);
                    setArtistReleaseArtwork(artistReleaseDraft.artwork || null);
                    setArtistReleaseStep(artistReleaseDraft.step || 1);
                  }
                  setArtistReleaseOpen(true);
                }}
              >
                ＋ Upload Music
              </button>
            </div>

            <div className="artistMusicSectionTitle">
              <div>
                <h2>Your Releases</h2>
                <small>
                  {artistReleases.length} {artistReleases.length === 1 ? 'release' : 'releases'}
                </small>
              </div>
            </div>

            {artistReleases.length === 0 ? (
              <div className="artistEmptyMusic">
                <div className="artistEmptyMusicIcon">🎵</div>
                <h3>No releases yet</h3>
                <p>
                  Your saved releases will appear here once you submit your first release.
                </p>

                <button
                  className="artistSecondaryButton"
                  onClick={() => {
                  if (artistReleaseDraft) {
                    setArtistReleaseTitle(artistReleaseDraft.title || '');
                    setArtistReleaseArtist(artistReleaseDraft.artist || '');
                    setArtistReleaseType(artistReleaseDraft.type || 'Single');
                    setArtistReleaseGenre(artistReleaseDraft.genre || '');
                    setArtistReleaseAudio(artistReleaseDraft.audio || null);
                    setArtistReleaseArtwork(artistReleaseDraft.artwork || null);
                    setArtistReleaseStep(artistReleaseDraft.step || 1);
                  }
                  setArtistReleaseOpen(true);
                }}
                >
                  Start Your First Release
                </button>
              </div>
            ) : (
              <div className="artistReleaseList">
                {artistReleases.map((release) => (
                  <div className="artistReleaseItem" key={release.id}>
                    {release.artwork?.uri ? (
                      <img
                        src={release.artwork.uri}
                        alt={release.title}
                        className="artistReleaseCover"
                      />
                    ) : (
                      <div className="artistReleaseCover artistReleaseCoverFallback">
                        🎵
                      </div>
                    )}

                    <div className="artistReleaseInfo">
                      <h3>{release.title}</h3>
                      <p>
                        {release.artist} • {release.type} • {release.genre}
                      </p>
                      <span>{release.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

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

            <Section title="Online Music">
              {onlineMusicLoading ? (
                <div className="empty">
                  <div>♫</div>
                  <p>Loading music...</p>
                </div>
              ) : onlineSongs.length > 0 ? (
                <div className="chartList">
                  {onlineSongs.map(song => (
                    <div
                      className="row onlineSongRow"
                      key={song.id}
                      onClick={() => {
                        if (!song.audioUrl) {
                          alert('This song is not available for playback yet.');
                          return;
                        }

                        startSong({
                          ...song,
                          uri: song.audioUrl,
                          title: song.title,
                          artist: song.artist,
                          album: 'Music World',
                          artwork: song.artworkUrl
                        });
                      }}
                      role="button"
                      tabIndex="0"
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.currentTarget.click();
                        }
                      }}
                    >
                      <div className="avatar">
                        {song.artworkUrl ? (
                          <img
                            src={song.artworkUrl}
                            alt=""
                          />
                        ) : (
                          song.artist?.[0] || '♪'
                        )}
                      </div>

                      <div className="meta">
                        <b>{song.title}</b>
                        <small>{song.artist}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <div>♫</div>
                  <h2>No online music yet</h2>
                  <p>Published artist releases will appear here.</p>
                </div>
              )}
            </Section>

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

{offlineMusicOpen ? (
  <>
    <button
      className="backButton"
      onClick={() => setOfflineMusicOpen(false)}
    >
      ← Your Library
    </button>

    <Title title="Downloads" />

    <p className="deviceMusicSubtitle">
      Music saved for offline listening
    </p>

    {offlineSongs.length === 0 ? (
      <div className="empty">
        <div>⬇️</div>
        <h2>No offline music yet</h2>
        <p>Download online songs to listen without internet.</p>
      </div>
    ) : (
      <div className="songList">
        {offlineSongs.map(song => {
          const isCurrentSong = playing?.id === song?.id;

          return (
            <div
              className={`songRow ${isCurrentSong ? 'playingSong' : ''}`}
              key={song.id}
              onClick={() => playOfflineSong(song)}
              role="button"
              tabIndex="0"
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.currentTarget.click();
                }
              }}
            >
              <div className="avatar">
                {song.artworkUrl ? (
                  <img src={song.artworkUrl} alt="" />
                ) : (
                  song.artist?.[0] || '♪'
                )}
              </div>

              <div className="meta">
                <b>{song.title || 'Unknown Song'}</b>
                <small>{song.artist || 'Unknown Artist'}</small>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </>
) : deviceMusicOpen ? (
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
                  onClick={() => setOfflineMusicOpen(true)}
                >
                  <span className="folderIcon">⬇️</span>
                  <span className="folderInfo">
                    <b>Downloads</b>
                    <small>Music saved for offline listening</small>
                  </span>
                  <span className="folderArrow">›</span>
                </button>

                <button
                  className="libraryFolder"
                  onClick={openDeviceMusic}
                >
                  <span className="folderIcon">📁</span>
                  <span className="folderInfo">
                    <b>Phone Music</b>
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

        {publicArtistOpen && publicArtist && (
          <div className="publicArtistPage">
            <div className="publicArtistHeader">
              <button
                className="artistBack"
                type="button"
                onClick={goBack}
              >
                ← Back
              </button>

              <span className="artistDashboardLabel">ARTIST</span>
            </div>

            <div className="publicArtistHero">
              <div className="publicArtistAvatar">
                {publicArtist.artwork ? (
                  <img
                    src={publicArtist.artwork}
                    alt={publicArtist.name || publicArtist.artistName || 'Artist'}
                  />
                ) : (
                  '🎤'
                )}
              </div>

              <div className="publicArtistIdentity">
                <span className="artistProfileTag">ARTIST</span>
                <h1>
                  {publicArtist.name || publicArtist.artistName || 'Artist'}
                  {publicArtist.verified && (
                    <span
                      className="publicArtistVerified"
                      title="Verified Music World artist"
                      aria-label="Verified artist"
                    >
                      ✓
                    </span>
                  )}
                </h1>
                <p>
                  {publicArtist.country || 'Country not set'}
                  {' • '}
                  {publicArtist.genre || 'Genre not set'}
                </p>
              </div>

              <button
                className="primary publicArtistFollow"
                type="button"
                onClick={() => {
                  if (!signedIn) {
                    setPendingFollowArtist(publicArtist);
                    setListenerAuthMode('create');
                    setListenerAuthError('');
                    setShowSignIn(true);
                    return;
                  }

                  setArtistFollowing(!artistFollowing);
                  setArtistFollowerCount(
                    artistFollowing
                      ? Math.max(0, artistFollowerCount - 1)
                      : artistFollowerCount + 1
                  );
                }}
              >
                {artistFollowing ? 'Following' : 'Follow'}
              </button>
            </div>

            <div className="publicArtistStats">
              <div>
                <strong>{artistFollowerCount}</strong>
                <span>Followers</span>
              </div>

              <div>
                <strong>{publicArtist.monthlyListeners || 0}</strong>
                <span>Monthly Listeners</span>
              </div>

              <div>
                <strong>{publicArtist.streams || 0}</strong>
                <span>Streams</span>
              </div>
            </div>

            <div className="publicArtistTabs">
              {['Music', 'Releases', 'About'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={publicArtistTab === tab ? 'active' : ''}
                  onClick={() => setPublicArtistTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {publicArtistTab === 'Music' && (
              <>
                <section className="publicArtistSection">
                  <div className="publicArtistSectionHeader">
                    <div>
                      <h2>Latest Release</h2>
                      <small>The newest music from this artist</small>
                    </div>
                  </div>

                  {publicArtist.releases && publicArtist.releases.length > 0 ? (
                    <div className="publicArtistReleaseCard">
                      <div className="publicArtistReleaseArtwork">
                        {publicArtist.releases[0].artwork ? (
                          <img
                            src={publicArtist.releases[0].artwork}
                            alt={publicArtist.releases[0].title || 'Release artwork'}
                          />
                        ) : (
                          '♫'
                        )}
                      </div>
                      <div>
                        <h3>{publicArtist.releases[0].title || 'Untitled Release'}</h3>
                        <p>
                          {publicArtist.releases[0].type || 'Single'}
                          {' • '}
                          {publicArtist.releases[0].genre || publicArtist.genre || 'Music'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="empty">
                      <div>♫</div>
                      <p>No releases yet.</p>
                    </div>
                  )}
                </section>

                <section className="publicArtistSection">
                  <div className="publicArtistSectionHeader">
                    <div>
                      <h2>Popular Songs</h2>
                      <small>Most played music from this artist</small>
                    </div>
                  </div>

                  {publicArtist.releases && publicArtist.releases.length > 0 ? (
                    <div className="publicArtistSongList">
                      {publicArtist.releases.slice(0, 5).map((release, index) => (
                        <div className="publicArtistSong" key={release.id || index}>
                          <span className="publicArtistSongNumber">{index + 1}</span>
                          <div>
                            <strong>{release.title || 'Untitled Song'}</strong>
                            <small>{release.type || 'Release'}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty">
                      <div>🎵</div>
                      <p>No songs yet.</p>
                    </div>
                  )}
                </section>
              </>
            )}

            {publicArtistTab === 'Releases' && (
              <section className="publicArtistSection">
                <div className="publicArtistSectionHeader">
                  <div>
                    <h2>All Releases</h2>
                    <small>Music from this artist</small>
                  </div>
                </div>

                {publicArtist.releases && publicArtist.releases.length > 0 ? (
                  <div className="publicArtistReleaseList">
                    {publicArtist.releases.map((release, index) => (
                      <div className="publicArtistReleaseItem" key={release.id || index}>
                        <div className="publicArtistReleaseArtwork">
                          {release.artwork ? (
                            <img
                              src={release.artwork}
                              alt={release.title || 'Release artwork'}
                            />
                          ) : (
                            '♫'
                          )}
                        </div>
                        <div>
                          <strong>{release.title || 'Untitled Release'}</strong>
                          <small>
                            {release.type || 'Single'}
                            {' • '}
                            {release.genre || publicArtist.genre || 'Music'}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty">
                    <div>♫</div>
                    <p>No releases yet.</p>
                  </div>
                )}
              </section>
            )}

            {publicArtistTab === 'About' && (
              <section className="publicArtistSection">
                <h2>About</h2>
                <p>
                  {publicArtist.bio || 'This artist has not added a bio yet.'}
                </p>
              </section>
            )}
          </div>
        )}

        {showSignIn && (
          <div className="profile listenerAuthPage">
            <Title title={listenerAuthMode === 'signin' ? 'Sign In' : 'Create Account'} />

            <div className="accountForm">
              {listenerAuthMode === 'create' && (
                <input
                  placeholder="Your name"
                  type="text"
                  value={listenerName}
                  onChange={(e) => {
                    setListenerName(e.target.value);
                    setListenerAuthError('');
                  }}
                />
              )}

              <input
                placeholder="Email address"
                type="email"
                value={listenerEmail}
                onChange={(e) => {
                  setListenerEmail(e.target.value);
                  setListenerAuthError('');
                }}
              />

              <input
                placeholder="Password"
                type="password"
                value={listenerPassword}
                onChange={(e) => {
                  setListenerPassword(e.target.value);
                  setListenerAuthError('');
                }}
              />

              <button
                className="primary"
                disabled={listenerAuthLoading}
                onClick={async () => {
                  const email = listenerEmail.trim();

                  if (listenerAuthMode === 'create') {
                    const name = listenerName.trim();

                    if (!name || !email || !listenerPassword) {
                      setListenerAuthError('Please enter your name, email and password.');
                      return;
                    }

                    if (listenerPassword.length < 6) {
                      setListenerAuthError('Password must be at least 6 characters.');
                      return;
                    }

                    setListenerAuthLoading(true);
                    setListenerAuthError('');

                    const { data, error } = await supabase.auth.signUp({
                      email,
                      password: listenerPassword,
                      options: {
                        data: {
                          displayName: name
                        }
                      }
                    });

                    setListenerAuthLoading(false);

                    if (error) {
                      setListenerAuthError(error.message);
                      return;
                    }

                    if (data?.session) {
                      setSignedIn(true);
                      setShowSignIn(false);
                      setListenerPassword('');
                      setListenerName('');

                      if (pendingFollowArtist) {
                        setPublicArtist(pendingFollowArtist);
                        setPublicArtistOpen(true);
                        setArtistFollowing(true);
                        setArtistFollowerCount(count => count + 1);
                        setPendingFollowArtist(null);
                      }
                    } else {
                      setListenerAuthError(
                        'Account created. Please check your email to confirm your account.'
                      );
                    }

                    return;
                  }

                  if (!email || !listenerPassword) {
                    setListenerAuthError('Please enter your email and password.');
                    return;
                  }

                  setListenerAuthLoading(true);
                  setListenerAuthError('');

                  const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password: listenerPassword
                  });

                  setListenerAuthLoading(false);

                  if (error) {
                    setListenerAuthError(error.message);
                    return;
                  }

                  if (data?.session) {
                    setSignedIn(true);
                    setShowSignIn(false);
                    setListenerPassword('');
                  }
                }}
              >
                {listenerAuthLoading ? (listenerAuthMode === 'signin' ? 'Signing In...' : 'Creating Account...') : (listenerAuthMode === 'signin' ? 'Sign In' : 'Create Account')}
              </button>

              {listenerAuthError && (
                <p className="authError">
                  {listenerAuthError}
                </p>
              )}

              <button
                type="button"
                className="authSwitchButton"
                onClick={() => {
                  setListenerAuthMode(
                    mode => mode === 'signin' ? 'create' : 'signin'
                  );
                  setListenerAuthError('');
                }}
              >
                {listenerAuthMode === 'signin'
                  ? 'New to Music World? Create an account'
                  : 'Already have an account? Sign in'}
              </button>

            </div>
          </div>
        )}

        {changePasswordOpen && (
          <section className="artistProfileStudio">
            <div className="artistProfileHeader">
              <button
                className="artistBack"
                onClick={() => setChangePasswordOpen(false)}
              >
                ← Account Settings
              </button>

              <span className="artistDashboardLabel">ACCOUNT</span>
              <h1>Change Password</h1>
              <p>Update your password for this device.</p>
            </div>

            <div className="artistProfileSection">
              <div className="artistProfileSectionTitle">
                <div>
                  <h2>Password</h2>
                  <small>For the current offline account</small>
                </div>
              </div>

              <div className="artistProfileFields">
                <label>
                  Current Password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </label>

                <label>
                  New Password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </label>

                <label>
                  Confirm New Password
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </label>
              </div>

              <button
                className="primary"
                onClick={() => {
                  const savedAccount = JSON.parse(
                    localStorage.getItem('musicWorldArtistAccount') || 'null'
                  );

                  if (!savedAccount) {
                    alert('No artist account found.');
                    return;
                  }

                  if (savedAccount.password !== currentPassword) {
                    alert('Current password is incorrect.');
                    return;
                  }

                  if (newPassword.length < 6) {
                    alert('New password must be at least 6 characters.');
                    return;
                  }

                  if (newPassword !== confirmNewPassword) {
                    alert('New passwords do not match.');
                    return;
                  }

                  const updatedAccount = {
                    ...savedAccount,
                    password: newPassword
                  };

                  localStorage.setItem(
                    'musicWorldArtistAccount',
                    JSON.stringify(updatedAccount)
                  );

                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setChangePasswordOpen(false);

                  alert('Password changed successfully.');
                }}
              >
                Save New Password
              </button>
            </div>
          </section>
        )}

        {accountInfoOpen && (
  <section className="artistProfileStudio">
    <div className="artistProfileHeader">
      <button
        className="artistBack"
        onClick={() => setAccountInfoOpen(false)}
      >
        ← Account Settings
      </button>

      <span className="artistDashboardLabel">ACCOUNT</span>
      <h1>Account Information</h1>
      <p>View the account information saved on this device.</p>
    </div>

    <div className="artistProfileSection">
      <div className="artistProfileSectionTitle">
        <div>
          <h2>Your Account</h2>
          <small>Music World account details</small>
        </div>
      </div>

      <div className="artistProfileFields">
        <label>
          Account Type
          <input
            type="text"
            value={artistAccount ? "Artist Account" : "Listener Account"}
            readOnly
          />
        </label>

        <label>
          Email
          <input
            type="text"
            value={artistAccount?.email || "Not available"}
            readOnly
          />
        </label>

        <label>
          Artist Name
          <input
            type="text"
            value={artistAccount?.artistName || "Not available"}
            readOnly
          />
        </label>
      </div>
    </div>
  </section>
)}

{accountInfoOpen && (
  <section className="artistProfileStudio">
    <div className="artistProfileHeader">
      <button
        className="artistBack"
        onClick={() => setAccountInfoOpen(false)}
      >
        ← Account Settings
      </button>

      <span className="artistDashboardLabel">ACCOUNT</span>
      <h1>Account Information</h1>
      <p>View the account information saved on this device.</p>
    </div>

    <div className="artistProfileSection">
      <div className="artistProfileSectionTitle">
        <div>
          <h2>Your Account</h2>
          <small>Music World account details</small>
        </div>
      </div>

      <div className="artistProfileFields">
        <label>
          Account Type
          <input
            type="text"
            value={artistAccount ? "Artist Account" : "Listener Account"}
            readOnly
          />
        </label>

        <label>
          Email
          <input
            type="text"
            value={artistAccount?.email || "Not available"}
            readOnly
          />
        </label>

        <label>
          Artist Name
          <input
            type="text"
            value={artistAccount?.artistName || "Not available"}
            readOnly
          />
        </label>
      </div>
    </div>
  </section>
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

              <button onClick={() => {
                setSettings(false);
                setChangePasswordOpen(true);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
              }}>
                🔐 Change Password
              </button>

              <button onClick={() => {
                setSettings(false);
                setAccountInfoOpen(true);
              }}>
                📧 Account Information
              </button>
            </section>

            <section>
              <h2>Music</h2>

              <button onClick={() => setTab('Library')}>
                🎶 My Playlist
              </button>

              <button onClick={() => {
                setSettings(false);
                openDeviceMusic();
              }}>
                📁 Device Music
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
              <div
                className="searchResult"
                key={a.searchType === 'online' ? `online-${a.id}` : `artist-${a.rank}`}
              >
                <button
                  onClick={() => {
                    if (a.searchType === 'online') {
                      startSong({
                        ...a,
                        uri: a.audioUrl,
                        title: a.title,
                        artist: a.artist,
                        album: 'Music World',
                        artwork: a.artworkUrl
                      });
                    } else {
                      startSong(a);
                    }

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

      {!artistOpen && !publicArtistOpen && (
        <nav className="bottomNav">
          {['Home', 'Discover', 'Charts', 'Library', 'Profile'].map(x => (
          <button
            className={`navItem ${tab === x && !settings && !showSignIn ? 'active' : ''}`}
            onClick={() => {
              setNavigationStack([x]);
              setTab(x);
              setSettings(false);
              setChangePasswordOpen(false);
              setAccountInfoOpen(false);
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

      {(settings || changePasswordOpen || accountInfoOpen || showSignIn || searchOpen || expandedPlayer || artistOpen || artistProfileEditOpen || artistReleaseOpen || artistMusicOpen || artistProfileOpen || artistAnalyticsOpen || artistAudienceOpen || artistEarningsOpen) && (
        <button className="backButton" onClick={goBack}>
          ← Back
        </button>
      )}

      {playing && !expandedPlayer && (
        <div
          className="player"
          onClick={() => setExpandedPlayer(true)}
        >
          <div className="cover">
            {playing.artwork ? (
              <img
                src={playing.artwork}
                alt=""
              />
            ) : (
              '♪'
            )}
          </div>

          <div className="pmeta">
            <b>{playing.title || playing.song || 'Unknown Song'}</b>
            <button
              type="button"
              className="playerArtistButton"
              onClick={openPlayingArtist}
            >
              {playing.artist || playing.artistName || playing.name || 'Unknown Artist'}
            </button>
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

          <div className="largeCover">
            {playing.artwork ? (
              <img
                src={playing.artwork}
                alt=""
              />
            ) : (
              '♪'
            )}
          </div>

          <p className="eyebrow">NOW PLAYING</p>
          <h1>{playing.title || playing.song || 'Unknown Song'}</h1>
          <p>
            <button
              type="button"
              className="playerArtistButton"
              onClick={openPlayingArtist}
            >
              {playing.artist || playing.artistName || playing.name || 'Unknown Artist'}
            </button>
            {playing.country ? ` · ${playing.country}` : ''}
          </p>

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
            <button
              className={`utilityButton ${shuffleEnabled ? 'activeUtility' : ''}`}
              aria-label={shuffleEnabled ? "Disable Shuffle" : "Enable Shuffle"}
              type="button"
              onClick={() => setShuffleEnabled(value => !value)}
            >
              🔀
            </button>

            <button
              className="skipButton"
              onClick={playPrevious}
              aria-label="Previous song"
            >
              ⏮
            </button>

            <button
              className="playButton"
              onClick={togglePlayback}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>

            <button
              className="skipButton"
              onClick={playNext}
              aria-label="Next song"
            >
              ⏭
            </button>

            <button
              className={`utilityButton ${repeatMode !== 'off' ? 'activeUtility' : ''}`}
              aria-label={
                repeatMode === 'off'
                  ? "Enable Repeat"
                  : repeatMode === 'all'
                    ? "Repeat All"
                    : "Repeat One"
              }
              type="button"
              onClick={() =>
                setRepeatMode(mode =>
                  mode === 'off'
                    ? 'all'
                    : mode === 'all'
                      ? 'one'
                      : 'off'
                )
              }
            >
              🔁
            </button>
          </div>

          <div className="playerActionRow">
            <button
              className="playerActionButton"
              onClick={() => openPlaylistPicker(playing)}
            >
              ＋ <span>Add to Playlist</span>
            </button>
          </div>

          {playing && onlineSongs.some(
            song => song?.id === playing?.id
          ) && (
            <div className="playerActionRow">
              <button
                className="playerActionButton offlineDownloadButton"
                onClick={async () => {
                  try {
                    await downloadSongForOffline(playing);
                  } catch (error) {
                    console.error('Offline download error:', error);
                  }
                }}
                disabled={
                  offlineMusicLoading ||
                  offlineSongs.some(song => song?.id === playing?.id)
                }
              >
                {offlineSongs.some(song => song?.id === playing?.id)
                  ? '✓ Available Offline'
                  : offlineMusicLoading
                    ? 'Downloading...'
                    : '↓ Download for Offline'}
              </button>
            </div>
          )}

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

function Section({ title, action, onAction, children }) {
  return (
    <section>
      <div className="sectionHead">
        <h2>{title}</h2>
        {action && (
          <button onClick={onAction}>
            {action} →
          </button>
        )}
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
