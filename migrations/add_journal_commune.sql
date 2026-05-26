-- Migration : colonne commune sur le journal d'activité (Render / PostgreSQL)
-- À exécuter une fois si la colonne n'existe pas encore (Hibernate peut l'avoir créée automatiquement).

ALTER TABLE journal_activite
  ADD COLUMN IF NOT EXISTS commune VARCHAR(100);
