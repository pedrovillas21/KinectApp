package com.kinetic.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "password_reset_codes")
public class PasswordResetCode extends OneTimeCode {
}
