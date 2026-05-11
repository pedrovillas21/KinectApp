package com.kinetic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KineticApplication {

	public static void main(String[] args) {
		SpringApplication.run(KineticApplication.class, args);
	}

}
