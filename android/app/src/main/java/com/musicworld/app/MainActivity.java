package com.musicworld.app;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.Arrays;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugins(Arrays.asList(DeviceMusicPlugin.class));
        super.onCreate(savedInstanceState);
    }
}
