package com.zunftgewerk.api.modules.identity.model;

import com.zunftgewerk.api.proto.v1.PasskeyMode;

public record PasskeyBeginResult(String challenge, String challengeId, String optionsJson, PasskeyMode mode) {
}
