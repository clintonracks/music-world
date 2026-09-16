package com.musicworld.app;

import android.Manifest;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.provider.MediaStore;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

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
        if (getPermissionState("music") == PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        requestPermissionForAlias("music", call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", getPermissionState("music") == PermissionState.GRANTED);
        call.resolve(result);
    }

    @PluginMethod
    public void getSongs(PluginCall call) {
        if (getPermissionState("music") != PermissionState.GRANTED) {
            call.reject("Music permission not granted");
            return;
        }

        ContentResolver resolver = getContext().getContentResolver();

        String[] projection = {
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.MIME_TYPE
        };

        JSArray songs = new JSArray();

        try {
            Uri audioUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;

            try (Cursor cursor = resolver.query(
                    audioUri,
                    projection,
                    null,
                    null,
                    MediaStore.Audio.Media.TITLE + " ASC"
            )) {
                if (cursor != null) {
                    int idColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                    int titleColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
                    int artistColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                    int albumColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
                    int durationColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
                    int mimeColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE);

                    while (cursor.moveToNext()) {
                        long id = cursor.getLong(idColumn);
                        String mimeType = cursor.getString(mimeColumn);

                        if (mimeType == null || !mimeType.startsWith("audio/")) {
                            continue;
                        }

                        JSObject song = new JSObject();

                        song.put("id", id);
                        song.put("title", cursor.getString(titleColumn));
                        song.put("artist", cursor.getString(artistColumn));
                        song.put("album", cursor.getString(albumColumn));
                        song.put("duration", cursor.getLong(durationColumn));

                        Uri songUri = Uri.withAppendedPath(audioUri, String.valueOf(id));
                        song.put("uri", songUri.toString());

                        songs.put(song);
                    }
                }
            }

            JSObject result = new JSObject();
            result.put("songs", songs);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Could not read device music", e);
        }
    }
}
