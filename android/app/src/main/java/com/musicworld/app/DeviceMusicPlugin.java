package com.musicworld.app;

import android.Manifest;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import android.provider.MediaStore;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;
import com.google.common.util.concurrent.ListenableFuture;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "DeviceMusic",
    permissions = {
        @Permission(
            alias = "music",
            strings = { Manifest.permission.READ_MEDIA_AUDIO }
        ),
        @Permission(
            alias = "musicLegacy",
            strings = { Manifest.permission.READ_EXTERNAL_STORAGE }
        )
    }
)
public class DeviceMusicPlugin extends Plugin {
    private MediaController mediaController;
    private ListenableFuture<MediaController> controllerFuture;
    private ListenableFuture<MediaController> getController() {
        if (controllerFuture == null) {
            SessionToken token = new SessionToken(
                getContext(),
                new android.content.ComponentName(
                    getContext(),
                    MusicPlaybackService.class
                )
            );

            controllerFuture = new MediaController.Builder(
                getContext(),
                token
            ).buildAsync();

            controllerFuture.addListener(() -> {
                try {
                    mediaController = controllerFuture.get();
                } catch (Exception e) {
                    android.util.Log.e("DeviceMusic", "MediaController connection failed", e);
                }
            }, androidx.core.content.ContextCompat.getMainExecutor(getContext()));
        }

        return controllerFuture;
    }

    @PluginMethod
    public void play(PluginCall call) {
        String uriString = call.getString("uri");

        if (uriString == null || uriString.isEmpty()) {
            call.reject("No audio URI provided");
            return;
        }

        getActivity().runOnUiThread(() -> {
            getController().addListener(() -> {
                try {
                    MediaController controller = getController().get();

                String title = call.getString("title", "Unknown Song");
                String artist = call.getString("artist", "Unknown Artist");
                String album = call.getString("album", "");

                MediaMetadata metadata = new MediaMetadata.Builder()
                    .setTitle(title)
                    .setArtist(artist)
                    .setAlbumTitle(album)
                    .build();

                MediaItem item = new MediaItem.Builder()
                    .setUri(Uri.parse(uriString))
                    .setMediaMetadata(metadata)
                    .build();

                controller.setMediaItem(item);

                controller.addListener(new androidx.media3.common.Player.Listener() {
                    private boolean finished = false;

                    @Override
                    public void onPlaybackStateChanged(int state) {
                        if (finished) return;

                        if (state == androidx.media3.common.Player.STATE_READY) {
                            finished = true;
                            call.resolve();
                        }
                    }

                    @Override
                    public void onPlayerError(androidx.media3.common.PlaybackException error) {
                        if (finished) return;

                        finished = true;
                        call.reject(
                            "Media3 playback error: " +
                            error.getErrorCodeName() +
                            " - " +
                            (error.getMessage() != null ? error.getMessage() : "unknown error")
                        );
                    }
                });

                controller.prepare();
                controller.play();

                } catch (Exception e) {
                    call.reject("Unable to start audio playback: " + e.getClass().getSimpleName() + " - " + (e.getMessage() != null ? e.getMessage() : "no message"));
                }
            }, androidx.core.content.ContextCompat.getMainExecutor(getContext()));
        });
    }

    @PluginMethod
    public void seekTo(PluginCall call) {
        Double position = call.getDouble("position");

        if (position == null || position < 0) {
            call.reject("Invalid seek position");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                if (mediaController == null) {
                    call.reject("Audio player is not ready");
                    return;
                }

                mediaController.seekTo(position.longValue());
                call.resolve();
            } catch (Exception e) {
                call.reject("Unable to seek audio", e);
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (mediaController != null) {
                    mediaController.stop();
                    mediaController.clearMediaItems();
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Unable to stop audio", e);
            }
        });
    }

    @PluginMethod
    public void pause(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (mediaController != null) {
                    mediaController.pause();
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Unable to pause audio", e);
            }
        });
    }

    @PluginMethod
    public void resume(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (mediaController != null) {
                    mediaController.play();
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Unable to resume audio", e);
            }
        });
    }

    @PluginMethod
    public void getPlaybackState(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            JSObject result = new JSObject();

            try {
                if (mediaController != null) {
                    result.put("isPlaying", mediaController.isPlaying());
                    result.put("currentTime", mediaController.getCurrentPosition());
                    result.put("duration", mediaController.getDuration());
                } else {
                    result.put("isPlaying", false);
                    result.put("currentTime", 0);
                    result.put("duration", 0);
                }

                call.resolve(result);
            } catch (Exception e) {
                call.reject("Unable to read playback state", e);
            }
        });
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        String permissionAlias;

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            permissionAlias = "music";
        } else {
            permissionAlias = "musicLegacy";
        }

        if (getPermissionState(permissionAlias) == com.getcapacitor.PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        if (permissionAlias.equals("music")) {
            requestPermissionForAlias("music", call, "permissionCallback");
        } else {
            requestPermissionForAlias("musicLegacy", call, "legacyPermissionCallback");
        }
    }

    @com.capacitor.annotation.PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put(
            "granted",
            getPermissionState("music") == com.getcapacitor.PermissionState.GRANTED
        );
        call.resolve(result);
    }

    @com.capacitor.annotation.PermissionCallback
    private void legacyPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put(
            "granted",
            getPermissionState("musicLegacy") == com.getcapacitor.PermissionState.GRANTED
        );
        call.resolve(result);
    }

    private JSObject getAudioMetadata(Uri uri) {
        JSObject song = new JSObject();
        String fallback = uri.getLastPathSegment();

        try {
            android.media.MediaMetadataRetriever mmr =
                    new android.media.MediaMetadataRetriever();
            mmr.setDataSource(getContext(), uri);

            String title = mmr.extractMetadata(
                    android.media.MediaMetadataRetriever.METADATA_KEY_TITLE);
            String artist = mmr.extractMetadata(
                    android.media.MediaMetadataRetriever.METADATA_KEY_ARTIST);
            String album = mmr.extractMetadata(
                    android.media.MediaMetadataRetriever.METADATA_KEY_ALBUM);

            song.put("title", title != null && !title.isEmpty() ? title : fallback);
            song.put("artist", artist != null ? artist : "");
            song.put("album", album != null ? album : "");
            song.put("uri", uri.toString());

            mmr.release();
        } catch (Exception e) {
            song.put("title", fallback);
            song.put("artist", "");
            song.put("album", "");
            song.put("uri", uri.toString());
        }

        return song;
    }

    @PluginMethod
    public void copyFileToCache(PluginCall call) {
        String uriString = call.getString("uri");

        if (uriString == null || uriString.isEmpty()) {
            call.reject("No file URI provided");
            return;
        }

        Uri uri = Uri.parse(uriString);

        try {
            ContentResolver resolver = getContext().getContentResolver();
            java.io.InputStream input = resolver.openInputStream(uri);

            if (input == null) {
                call.reject("Unable to open selected file");
                return;
            }

            String fileName = uri.getLastPathSegment();

            if (fileName == null || fileName.isEmpty()) {
                fileName = "musicworld-upload-file";
            }

            fileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");

            java.io.File cacheDir = getContext().getCacheDir();
            java.io.File outputFile = new java.io.File(
                cacheDir,
                System.currentTimeMillis() + "-" + fileName
            );

            java.io.OutputStream output =
                new java.io.FileOutputStream(outputFile);

            byte[] buffer = new byte[8192];
            int bytesRead;

            while ((bytesRead = input.read(buffer)) != -1) {
                output.write(buffer, 0, bytesRead);
            }

            output.flush();
            output.close();
            input.close();

            JSObject response = new JSObject();
            response.put("path", outputFile.getAbsolutePath());
            response.put("name", fileName);

            call.resolve(response);

        } catch (Exception e) {
            call.reject(
                "Unable to copy selected file: " +
                (e.getMessage() != null ? e.getMessage() : "Unknown error")
            );
        }
    }

    @PluginMethod
    public void pickAudio(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("audio/*");
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        );
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(call, intent, "audioPickerResult");
    }

    @PluginMethod
    public void pickArtwork(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("image/*");
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        );
        startActivityForResult(call, intent, "artworkPickerResult");
    }

    @com.getcapacitor.annotation.ActivityCallback
    private void artworkPickerResult(PluginCall call, ActivityResult result) {
        JSObject response = new JSObject();

        if (result.getResultCode() == android.app.Activity.RESULT_OK
                && result.getData() != null
                && result.getData().getData() != null) {

            Uri uri = result.getData().getData();

            try {
                getContext().getContentResolver().takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                );
            } catch (Exception ignored) {
            }

            response.put("uri", uri.toString());
            response.put("name", uri.getLastPathSegment());
        }

        call.resolve(response);
    }

    @com.getcapacitor.annotation.ActivityCallback
    private void audioPickerResult(PluginCall call, ActivityResult result) {
        JSObject response = new JSObject();
        org.json.JSONArray songs = new org.json.JSONArray();

        if (result.getResultCode() == android.app.Activity.RESULT_OK && result.getData() != null) {
            Intent data = result.getData();

            if (data.getClipData() != null) {
                android.content.ClipData clipData = data.getClipData();

                for (int i = 0; i < clipData.getItemCount(); i++) {
                    Uri uri = clipData.getItemAt(i).getUri();
                    try {
                        getContext().getContentResolver().takePersistableUriPermission(
                            uri,
                            Intent.FLAG_GRANT_READ_URI_PERMISSION
                        );
                    } catch (Exception ignored) {
                    }
                    JSObject song = getAudioMetadata(uri);
                    songs.put(song);
                }
            } else if (data.getData() != null) {
                Uri uri = data.getData();
                try {
                    getContext().getContentResolver().takePersistableUriPermission(
                        uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    );
                } catch (Exception ignored) {
                }
                JSObject song = new JSObject();
                song.put("title", uri.getLastPathSegment());
                song.put("artist", "");
                song.put("album", "");
                song.put("uri", uri.toString());
                songs.put(song);
            }
        }

        response.put("songs", songs);
        call.resolve(response);
    }

    @PluginMethod
    public void getSongs(PluginCall call) {
        String permissionAlias;

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            permissionAlias = "music";
        } else {
            permissionAlias = "musicLegacy";
        }

        if (getPermissionState(permissionAlias) != com.getcapacitor.PermissionState.GRANTED) {
            call.reject("Music permission is not granted");
            return;
        }

        ContentResolver resolver = getContext().getContentResolver();
        Uri collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;

        String[] projection = {
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.DISPLAY_NAME,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.MIME_TYPE
        };

        JSObject result = new JSObject();
        org.json.JSONArray songs = new org.json.JSONArray();

        try {
            Cursor cursor = resolver.query(
                collection,
                projection,
                null,
                null,
                MediaStore.Audio.Media.TITLE + " ASC"
            );

            if (cursor != null) {
                int idColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                int displayColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME);
                int titleColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
                int artistColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                int albumColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
                int durationColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);

                while (cursor.moveToNext()) {
                    long id = cursor.getLong(idColumn);

                    String displayName = cursor.getString(displayColumn);
                    String title = cursor.getString(titleColumn);
                    String artist = cursor.getString(artistColumn);
                    String album = cursor.getString(albumColumn);
                    long duration = cursor.getLong(durationColumn);

                    JSObject song = new JSObject();

                    song.put("id", id);
                    song.put(
                        "title",
                        title != null && !title.isEmpty() ? title : displayName
                    );
                    song.put(
                        "artist",
                        artist != null && !artist.equals("<unknown>") ? artist : ""
                    );
                    song.put(
                        "album",
                        album != null && !album.equals("<unknown>") ? album : ""
                    );
                    song.put("duration", duration);
                    song.put(
                        "uri",
                        android.content.ContentUris.withAppendedId(
                            collection,
                            id
                        ).toString()
                    );

                    songs.put(song);
                }

                cursor.close();
            }

            result.put("songs", songs);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Unable to read device music", e);
        }
    }
}
