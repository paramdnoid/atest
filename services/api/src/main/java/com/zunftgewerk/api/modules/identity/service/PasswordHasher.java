package com.zunftgewerk.api.modules.identity.service;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import org.springframework.stereotype.Component;

@Component
public class PasswordHasher {

    private final Argon2 argon2 = Argon2Factory.create();

    public String hash(String password) {
        return argon2.hash(3, 65536, 1, password.toCharArray());
    }

    public boolean verify(String hash, String password) {
        return argon2.verify(hash, password.toCharArray());
    }
}
