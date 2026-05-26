package com.reserve.admin.model;

public enum Role {
    ADMIN,
    // Le "USER" correspond aux AGENTS (accès visite / mobile).
    USER,
    // Le "SUPER_ADMIN" a accès à l'historique complet et aux paramètres sensibles.
    SUPER_ADMIN
}
