-- ============================================================
-- Script de création de la base de données : reserves_db
-- Application : Gestion des Réserves Administratives
-- ============================================================

CREATE DATABASE IF NOT EXISTS reserves_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE reserves_db;

-- -------------------------------------------------------
-- Table : utilisateur
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilisateur (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role     VARCHAR(50)  NOT NULL DEFAULT 'USER'
);

-- -------------------------------------------------------
-- Table : reserve
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS reserve (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom          VARCHAR(255) NOT NULL,
    localisation VARCHAR(255) NOT NULL DEFAULT 'Non spécifiée',
    superficie   DOUBLE,
    type         VARCHAR(100) NOT NULL DEFAULT 'Mobile',
    latitude     DOUBLE,
    longitude    DOUBLE,
    statut       VARCHAR(100) NOT NULL DEFAULT 'Active',
    description  TEXT,
    proprietaire VARCHAR(255),
    reference    VARCHAR(255),
    zone         LONGTEXT,       -- JSON GeoJSON des coordonnées délimitées
    created_at   DATETIME,
    updated_at   DATETIME
);

-- -------------------------------------------------------
-- Table : commune
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS commune (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom        VARCHAR(255) NOT NULL,
    code       VARCHAR(50),
    region     VARCHAR(255),
    reserve_id BIGINT,
    FOREIGN KEY (reserve_id) REFERENCES reserve(id) ON DELETE SET NULL
);

-- -------------------------------------------------------
-- Table : alerte
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerte (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    message    TEXT NOT NULL,
    type       VARCHAR(100),
    date_alerte DATETIME,
    reserve_id BIGINT,
    FOREIGN KEY (reserve_id) REFERENCES reserve(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- Table : projet
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS projet (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(255) NOT NULL,
    description TEXT,
    statut      VARCHAR(100),
    date_debut  DATE,
    date_fin    DATE,
    reserve_id  BIGINT,
    FOREIGN KEY (reserve_id) REFERENCES reserve(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- Table : historique_juridique
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS historique_juridique (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    titre       VARCHAR(255),
    description TEXT,
    date_evenement DATE,
    reserve_id  BIGINT,
    FOREIGN KEY (reserve_id) REFERENCES reserve(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- Table : document
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS document (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom        VARCHAR(255),
    chemin     VARCHAR(500),
    type       VARCHAR(100),
    taille     BIGINT,
    reserve_id BIGINT,
    FOREIGN KEY (reserve_id) REFERENCES reserve(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- Table : administrative_division
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS administrative_division (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom        VARCHAR(255) NOT NULL,
    type       VARCHAR(100),
    code       VARCHAR(50),
    reserve_id BIGINT,
    FOREIGN KEY (reserve_id) REFERENCES reserve(id) ON DELETE SET NULL
);

-- -------------------------------------------------------
-- Utilisateur ADMIN par défaut
-- Mot de passe : admin123 (BCrypt encodé)
-- -------------------------------------------------------
INSERT IGNORE INTO utilisateur (username, password, role)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN');

-- Utilisateur normal par défaut
-- Mot de passe : user123
INSERT IGNORE INTO utilisateur (username, password, role)
VALUES ('user', '$2a$10$8K1p/a0dR50gT.QMpF.xS.mJgCy3LxnRKXEe.HZn1Q1aeXJTKTqEC', 'USER');

-- -------------------------------------------------------
-- Fin du script
-- -------------------------------------------------------
SELECT 'Base de données reserves_db créée avec succès !' AS message;
