package com.localconnect.entity;

public enum Role {
    BUYER,
    PENDING_SELLER,   // Self-registered seller applicant; awaiting admin approval
    SELLER,           // Approved seller — can create stores and list products
    ADMIN
}
