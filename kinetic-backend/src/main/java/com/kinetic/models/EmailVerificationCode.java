package com.kinetic.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "email_verification_codes")
public class EmailVerificationCode extends OneTimeCode {
}
