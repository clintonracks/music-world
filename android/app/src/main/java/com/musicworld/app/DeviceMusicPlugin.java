package com.musicworld.app;

import android.Manifest;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import android.provider.MediaStore;

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
        )
    }
)
public class DeviceMusicPlugin extends Plugin {
    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getPermissionState("music") == com.getcapacitor.PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        requestPermissionForAlias("music", call, "permissionCallback");
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put(
            "granted",
            getPermissionState("music") == com.getcapacitor.PermissionState.GRANTED
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
    public void pickAudio(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("audio/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(call, intent, "audioPickerResult");
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
                    JSObject song = getAudioMetadata(uri);
                    songs.put(song);
                }
            } else if (data.getData() != null) {
                Uri uri = data.getData();
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
        ContentResolver resolver = getContext().getContentResolver();

        Uri collection = MediaStore.Files.getContentUri("external");

        String[] projection = {
            MediaStore.Files.FileColumns._ID,
            MediaStore.Files.FileColumns.DISPLAY_NAME,
            MediaStore.Files.FileColumns.MIME_TYPE
        };

        JSObject result = new JSObject();

        try {
            Cursor cursor = resolver.query(
                collection,
                projection,
                MediaStore.Files.FileColumns.MEDIA_TYPE + " = ?",
                new String[] { String.valueOf(MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO) },
                MediaStore.Files.FileColumns.DISPLAY_NAME + " ASC"
            );

            org.json.JSONArray songs = new org.json.JSONArray();

            if (cursor != null) {
                int idColumn =
                    cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID);
                int titleColumn =
                    cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DISPLAY_NAME);
                while (cursor.moveToNext()) {
                    JSObject song = new JSObject();

                    long id = cursor.getLong(idColumn);

                    song.put("id", id);
                    song.put("title", cursor.getString(titleColumn));
                    song.put("artist", "");
                    song.put("album", "");
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
