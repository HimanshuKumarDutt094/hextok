package com.hextok.custom;

import com.lynx.tasm.LynxEnv;
import com.lynx.tasm.behavior.Behavior;
import com.lynx.tasm.behavior.LynxContext;

public class CustomElementRegistry {

    public static void register() {
        LynxEnv.inst().addBehavior(new Behavior("LynxButton") {
            @Override
            public LynxButton createUI(LynxContext context) {
                return new LynxButton(context);
            }
        });
    }
}
