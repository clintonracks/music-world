package com.musicworld.app;

import androidx.annotation.Nullable;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

public class MusicPlaybackService extends MediaSessionService {

    private ExoPlayer player;
    private MediaSession mediaSession;

    @Override
    public void onCreate() {
        super.onCreate();

        player = new ExoPlayer.Builder(this).build();

        player.setAudioAttributes(
            new AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA)
                .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                .build(),
            true
        );

        mediaSession = new MediaSession.Builder(this, player).build();
    }

    @Override
    public MediaSession onGetSession(
        MediaSession.ControllerInfo controllerInfo
    ) {
        return mediaSession;
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }

        if (player != null) {
            player.release();
            player = null;
        }

        super.onDestroy();
    }
}
