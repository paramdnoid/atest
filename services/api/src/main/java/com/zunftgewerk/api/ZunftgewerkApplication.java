package com.zunftgewerk.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ZunftgewerkApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZunftgewerkApplication.class, args);
    }
}
