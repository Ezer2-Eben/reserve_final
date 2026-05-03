-- Script de migration pour la table document
-- Ajout des champs nécessaires au stockage hybride de fichiers

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE document 
ADD COLUMN nom_fichier_original VARCHAR(255) AFTER nom_fichier,
ADD COLUMN taille_fichier BIGINT AFTER type_fichier,
ADD COLUMN hash_fichier VARCHAR(64) AFTER taille_fichier,
ADD COLUMN chemin_fichier VARCHAR(500) AFTER url,
ADD COLUMN date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER chemin_fichier;

-- 2. Rendre l'URL optionnelle (pour compatibilité)
ALTER TABLE document MODIFY COLUMN url VARCHAR(500) NULL;

-- 3. Ajouter des index pour améliorer les performances
CREATE INDEX idx_document_reserve_id ON document(reserve_id);
CREATE INDEX idx_document_date_upload ON document(date_upload);
CREATE INDEX idx_document_type_fichier ON document(type_fichier);

-- 4. Ajouter des contraintes pour la validation
ALTER TABLE document 
ADD CONSTRAINT chk_taille_fichier CHECK (taille_fichier >= 0),
ADD CONSTRAINT chk_type_fichier CHECK (type_fichier IN ('PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'IMG', 'JPG', 'PNG', 'GIF', 'VIDEO', 'MP4', 'AVI', 'AUDIO', 'MP3', 'WAV', 'ZIP', 'RAR', 'AUTRE'));

-- 5. Commentaires pour documenter la structure
ALTER TABLE document 
MODIFY COLUMN nom_fichier_original VARCHAR(255) COMMENT 'Nom original du fichier uploadé',
MODIFY COLUMN taille_fichier BIGINT COMMENT 'Taille du fichier en bytes',
MODIFY COLUMN hash_fichier VARCHAR(64) COMMENT 'Hash SHA-256 du fichier pour vérification d''intégrité',
MODIFY COLUMN chemin_fichier VARCHAR(500) COMMENT 'Chemin relatif du fichier sur le serveur',
MODIFY COLUMN date_upload TIMESTAMP COMMENT 'Date et heure de l''upload';

-- 6. Vérification de la structure
DESCRIBE document;

-- 7. Exemple de données de test (optionnel)
-- INSERT INTO document (nom_fichier, nom_fichier_original, type_fichier, taille_fichier, hash_fichier, chemin_fichier, reserve_id) 
-- VALUES ('document_test.pdf', 'rapport_2024.pdf', 'PDF', 1024000, 'abc123...', 'uploads/documents/2024/01/document_test.pdf', 1); 