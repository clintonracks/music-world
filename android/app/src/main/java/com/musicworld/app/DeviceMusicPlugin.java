package com.musicworld.app;

import android.Manifest;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
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
    public void getSongs(PluginCall call) {
        ContentResolver resolver = getContext().getContentResolver();

        Uri collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;

        String[] projection = {
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM
        };

        JSObject result = new JSObject();

        try {
            Cursor cursor = resolver.query(
                collection,
                projection,
                MediaStore.Audio.Media.IS_MUSIC + " != 0",
                null,
                MediaStore.Audio.Media.TITLE + " ASC"
            );

            org.json.JSONArray songs = new org.json.JSONArray();

            if (cursor != null) {
                int idColumn =
                    cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                int titleColumn =
                    cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
                int artistColumn =
                    cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                int albumColumn =
                    cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);

                while (cursor.moveToNext()) {
                    JSObject song = new JSObject();

                    long id = cursor.getLong(idColumn);

                    song.put("id", id);
                    song.put("title", cursor.getString(titleColumn));
                    song.put("artist", cursor.getString(artistColumn));
                    song.put("album", cursor.getString(albumColumn));
                    song.put(
                        "uri",
                        Uri.withAppendedPath(
                            collection,
                            String.valueOf(id)
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
