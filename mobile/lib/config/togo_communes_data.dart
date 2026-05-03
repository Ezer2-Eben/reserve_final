/// Données complètes des 117 communes du Togo (Réforme de la décentralisation).
/// Organisées par région avec coordonnées GPS approximatives des chefs-lieux.
class TogoCommune {
  final String nom;
  final String region;
  final String prefecture;
  final double latitude;
  final double longitude;

  const TogoCommune({
    required this.nom,
    required this.region,
    required this.prefecture,
    required this.latitude,
    required this.longitude,
  });
}

class TogoCommunes {
  static const List<TogoCommune> all = [
    // ── SAVANES (16 communes) ────────────────────────────────────────────────
    TogoCommune(nom: 'Cinkassé 1', region: 'Savanes', prefecture: 'Cinkassé', latitude: 11.0833, longitude: 0.0167),
    TogoCommune(nom: 'Cinkassé 2', region: 'Savanes', prefecture: 'Cinkassé', latitude: 11.0833, longitude: 0.0167),
    TogoCommune(nom: 'Kpendjal 1', region: 'Savanes', prefecture: 'Kpendjal', latitude: 10.8333, longitude: 0.7500),
    TogoCommune(nom: 'Kpendjal 2', region: 'Savanes', prefecture: 'Kpendjal', latitude: 10.8333, longitude: 0.7500),
    TogoCommune(nom: 'Kpendjal-Ouest 1', region: 'Savanes', prefecture: 'Kpendjal-Ouest', latitude: 10.8333, longitude: 0.5000),
    TogoCommune(nom: 'Kpendjal-Ouest 2', region: 'Savanes', prefecture: 'Kpendjal-Ouest', latitude: 10.8333, longitude: 0.5000),
    TogoCommune(nom: 'Oti 1', region: 'Savanes', prefecture: 'Oti', latitude: 10.3667, longitude: 0.4667),
    TogoCommune(nom: 'Oti 2', region: 'Savanes', prefecture: 'Oti', latitude: 10.3667, longitude: 0.4667),
    TogoCommune(nom: 'Oti-Sud 1', region: 'Savanes', prefecture: 'Oti-Sud', latitude: 10.2000, longitude: 0.3000),
    TogoCommune(nom: 'Oti-Sud 2', region: 'Savanes', prefecture: 'Oti-Sud', latitude: 10.2000, longitude: 0.3000),
    TogoCommune(nom: 'Tandjouaré 1', region: 'Savanes', prefecture: 'Tandjouaré', latitude: 10.6500, longitude: 0.2000),
    TogoCommune(nom: 'Tandjouaré 2', region: 'Savanes', prefecture: 'Tandjouaré', latitude: 10.6500, longitude: 0.2000),
    TogoCommune(nom: 'Tône 1', region: 'Savanes', prefecture: 'Tône', latitude: 10.8667, longitude: 0.2000),
    TogoCommune(nom: 'Tône 2', region: 'Savanes', prefecture: 'Tône', latitude: 10.8667, longitude: 0.2000),
    TogoCommune(nom: 'Tône 3', region: 'Savanes', prefecture: 'Tône', latitude: 10.8667, longitude: 0.2000),
    TogoCommune(nom: 'Tône 4', region: 'Savanes', prefecture: 'Tône', latitude: 10.8667, longitude: 0.2000),

    // ── KARA (22 communes) ───────────────────────────────────────────────────
    TogoCommune(nom: 'Assoli 1', region: 'Kara', prefecture: 'Assoli', latitude: 9.3500, longitude: 1.2667),
    TogoCommune(nom: 'Assoli 2', region: 'Kara', prefecture: 'Assoli', latitude: 9.3500, longitude: 1.2667),
    TogoCommune(nom: 'Assoli 3', region: 'Kara', prefecture: 'Assoli', latitude: 9.3500, longitude: 1.2667),
    TogoCommune(nom: 'Bassar 1', region: 'Kara', prefecture: 'Bassar', latitude: 9.2500, longitude: 0.7833),
    TogoCommune(nom: 'Bassar 2', region: 'Kara', prefecture: 'Bassar', latitude: 9.2500, longitude: 0.7833),
    TogoCommune(nom: 'Bassar 3', region: 'Kara', prefecture: 'Bassar', latitude: 9.2500, longitude: 0.7833),
    TogoCommune(nom: 'Bassar 4', region: 'Kara', prefecture: 'Bassar', latitude: 9.2500, longitude: 0.7833),
    TogoCommune(nom: 'Binah 1', region: 'Kara', prefecture: 'Binah', latitude: 9.7333, longitude: 1.3667),
    TogoCommune(nom: 'Binah 2', region: 'Kara', prefecture: 'Binah', latitude: 9.7333, longitude: 1.3667),
    TogoCommune(nom: 'Dankpen 1', region: 'Kara', prefecture: 'Dankpen', latitude: 9.4167, longitude: 0.5833),
    TogoCommune(nom: 'Dankpen 2', region: 'Kara', prefecture: 'Dankpen', latitude: 9.4167, longitude: 0.5833),
    TogoCommune(nom: 'Dankpen 3', region: 'Kara', prefecture: 'Dankpen', latitude: 9.4167, longitude: 0.5833),
    TogoCommune(nom: 'Doufelgou 1', region: 'Kara', prefecture: 'Doufelgou', latitude: 9.7667, longitude: 1.1000),
    TogoCommune(nom: 'Doufelgou 2', region: 'Kara', prefecture: 'Doufelgou', latitude: 9.7667, longitude: 1.1000),
    TogoCommune(nom: 'Doufelgou 3', region: 'Kara', prefecture: 'Doufelgou', latitude: 9.7667, longitude: 1.1000),
    TogoCommune(nom: 'Kéran 1', region: 'Kara', prefecture: 'Kéran', latitude: 9.9667, longitude: 1.0500),
    TogoCommune(nom: 'Kéran 2', region: 'Kara', prefecture: 'Kéran', latitude: 9.9667, longitude: 1.0500),
    TogoCommune(nom: 'Kéran 3', region: 'Kara', prefecture: 'Kéran', latitude: 9.9667, longitude: 1.0500),
    TogoCommune(nom: 'Kozah 1', region: 'Kara', prefecture: 'Kozah', latitude: 9.5500, longitude: 1.1833),
    TogoCommune(nom: 'Kozah 2', region: 'Kara', prefecture: 'Kozah', latitude: 9.5500, longitude: 1.1833),
    TogoCommune(nom: 'Kozah 3', region: 'Kara', prefecture: 'Kozah', latitude: 9.5500, longitude: 1.1833),
    TogoCommune(nom: 'Kozah 4', region: 'Kara', prefecture: 'Kozah', latitude: 9.5500, longitude: 1.1833),

    // ── CENTRALE (15 communes) ──────────────────────────────────────────────
    TogoCommune(nom: 'Blitta 1', region: 'Centrale', prefecture: 'Blitta', latitude: 8.3167, longitude: 0.9833),
    TogoCommune(nom: 'Blitta 2', region: 'Centrale', prefecture: 'Blitta', latitude: 8.3167, longitude: 0.9833),
    TogoCommune(nom: 'Blitta 3', region: 'Centrale', prefecture: 'Blitta', latitude: 8.3167, longitude: 0.9833),
    TogoCommune(nom: 'Mô 1', region: 'Centrale', prefecture: 'Mô', latitude: 8.7167, longitude: 0.6500),
    TogoCommune(nom: 'Mô 2', region: 'Centrale', prefecture: 'Mô', latitude: 8.7167, longitude: 0.6500),
    TogoCommune(nom: 'Sotouboua 1', region: 'Centrale', prefecture: 'Sotouboua', latitude: 8.5667, longitude: 0.9833),
    TogoCommune(nom: 'Sotouboua 2', region: 'Centrale', prefecture: 'Sotouboua', latitude: 8.5667, longitude: 0.9833),
    TogoCommune(nom: 'Sotouboua 3', region: 'Centrale', prefecture: 'Sotouboua', latitude: 8.5667, longitude: 0.9833),
    TogoCommune(nom: 'Tchamba 1', region: 'Centrale', prefecture: 'Tchamba', latitude: 9.0333, longitude: 1.4167),
    TogoCommune(nom: 'Tchamba 2', region: 'Centrale', prefecture: 'Tchamba', latitude: 9.0333, longitude: 1.4167),
    TogoCommune(nom: 'Tchamba 3', region: 'Centrale', prefecture: 'Tchamba', latitude: 9.0333, longitude: 1.4167),
    TogoCommune(nom: 'Tchaoudjo 1', region: 'Centrale', prefecture: 'Tchaoudjo', latitude: 8.9833, longitude: 1.1333),
    TogoCommune(nom: 'Tchaoudjo 2', region: 'Centrale', prefecture: 'Tchaoudjo', latitude: 8.9833, longitude: 1.1333),
    TogoCommune(nom: 'Tchaoudjo 3', region: 'Centrale', prefecture: 'Tchaoudjo', latitude: 8.9833, longitude: 1.1333),
    TogoCommune(nom: 'Tchaoudjo 4', region: 'Centrale', prefecture: 'Tchaoudjo', latitude: 8.9833, longitude: 1.1333),

    // ── PLATEAUX (32 communes) ──────────────────────────────────────────────
    TogoCommune(nom: 'Agou 1', region: 'Plateaux', prefecture: 'Agou', latitude: 6.9167, longitude: 0.7333),
    TogoCommune(nom: 'Agou 2', region: 'Plateaux', prefecture: 'Agou', latitude: 6.9167, longitude: 0.7333),
    TogoCommune(nom: 'Akébou 1', region: 'Plateaux', prefecture: 'Akébou', latitude: 7.7333, longitude: 0.7167),
    TogoCommune(nom: 'Akébou 2', region: 'Plateaux', prefecture: 'Akébou', latitude: 7.7333, longitude: 0.7167),
    TogoCommune(nom: 'Amou 1', region: 'Plateaux', prefecture: 'Amou', latitude: 7.3833, longitude: 0.9833),
    TogoCommune(nom: 'Amou 2', region: 'Plateaux', prefecture: 'Amou', latitude: 7.3833, longitude: 0.9833),
    TogoCommune(nom: 'Amou 3', region: 'Plateaux', prefecture: 'Amou', latitude: 7.3833, longitude: 0.9833),
    TogoCommune(nom: 'Anié 1', region: 'Plateaux', prefecture: 'Anié', latitude: 7.7500, longitude: 1.1833),
    TogoCommune(nom: 'Anié 2', region: 'Plateaux', prefecture: 'Anié', latitude: 7.7500, longitude: 1.1833),
    TogoCommune(nom: 'Danyi 1', region: 'Plateaux', prefecture: 'Danyi', latitude: 7.0333, longitude: 0.7000),
    TogoCommune(nom: 'Danyi 2', region: 'Plateaux', prefecture: 'Danyi', latitude: 7.0333, longitude: 0.7000),
    TogoCommune(nom: 'Est-Mono 1', region: 'Plateaux', prefecture: 'Est-Mono', latitude: 7.6833, longitude: 1.4500),
    TogoCommune(nom: 'Est-Mono 2', region: 'Plateaux', prefecture: 'Est-Mono', latitude: 7.6833, longitude: 1.4500),
    TogoCommune(nom: 'Est-Mono 3', region: 'Plateaux', prefecture: 'Est-Mono', latitude: 7.6833, longitude: 1.4500),
    TogoCommune(nom: 'Haho 1', region: 'Plateaux', prefecture: 'Haho', latitude: 6.9500, longitude: 1.1667),
    TogoCommune(nom: 'Haho 2', region: 'Plateaux', prefecture: 'Haho', latitude: 6.9500, longitude: 1.1667),
    TogoCommune(nom: 'Haho 3', region: 'Plateaux', prefecture: 'Haho', latitude: 6.9500, longitude: 1.1667),
    TogoCommune(nom: 'Haho 4', region: 'Plateaux', prefecture: 'Haho', latitude: 6.9500, longitude: 1.1667),
    TogoCommune(nom: 'Kloto 1', region: 'Plateaux', prefecture: 'Kloto', latitude: 6.8944, longitude: 0.6250),
    TogoCommune(nom: 'Kloto 2', region: 'Plateaux', prefecture: 'Kloto', latitude: 6.8944, longitude: 0.6250),
    TogoCommune(nom: 'Kloto 3', region: 'Plateaux', prefecture: 'Kloto', latitude: 6.8944, longitude: 0.6250),
    TogoCommune(nom: 'Kpélé 1', region: 'Plateaux', prefecture: 'Kpélé', latitude: 7.0833, longitude: 0.7500),
    TogoCommune(nom: 'Kpélé 2', region: 'Plateaux', prefecture: 'Kpélé', latitude: 7.0833, longitude: 0.7500),
    TogoCommune(nom: 'Moyen-Mono 1', region: 'Plateaux', prefecture: 'Moyen-Mono', latitude: 7.1667, longitude: 1.4500),
    TogoCommune(nom: 'Moyen-Mono 2', region: 'Plateaux', prefecture: 'Moyen-Mono', latitude: 7.1667, longitude: 1.4500),
    TogoCommune(nom: 'Ogou 1', region: 'Plateaux', prefecture: 'Ogou', latitude: 7.5333, longitude: 1.1333),
    TogoCommune(nom: 'Ogou 2', region: 'Plateaux', prefecture: 'Ogou', latitude: 7.5333, longitude: 1.1333),
    TogoCommune(nom: 'Ogou 3', region: 'Plateaux', prefecture: 'Ogou', latitude: 7.5333, longitude: 1.1333),
    TogoCommune(nom: 'Ogou 4', region: 'Plateaux', prefecture: 'Ogou', latitude: 7.5333, longitude: 1.1333),
    TogoCommune(nom: 'Wawa 1', region: 'Plateaux', prefecture: 'Wawa', latitude: 7.5833, longitude: 0.6000),
    TogoCommune(nom: 'Wawa 2', region: 'Plateaux', prefecture: 'Wawa', latitude: 7.5833, longitude: 0.6000),
    TogoCommune(nom: 'Wawa 3', region: 'Plateaux', prefecture: 'Wawa', latitude: 7.5833, longitude: 0.6000),

    // ── MARITIME (32 communes) ──────────────────────────────────────────────
    TogoCommune(nom: 'Agoè-Nyivé 1', region: 'Maritime', prefecture: 'Agoè-Nyivé', latitude: 6.2000, longitude: 1.2333),
    TogoCommune(nom: 'Agoè-Nyivé 2', region: 'Maritime', prefecture: 'Agoè-Nyivé', latitude: 6.2000, longitude: 1.2333),
    TogoCommune(nom: 'Agoè-Nyivé 3', region: 'Maritime', prefecture: 'Agoè-Nyivé', latitude: 6.2000, longitude: 1.2333),
    TogoCommune(nom: 'Agoè-Nyivé 4', region: 'Maritime', prefecture: 'Agoè-Nyivé', latitude: 6.2000, longitude: 1.2333),
    TogoCommune(nom: 'Agoè-Nyivé 5', region: 'Maritime', prefecture: 'Agoè-Nyivé', latitude: 6.2000, longitude: 1.2333),
    TogoCommune(nom: 'Agoè-Nyivé 6', region: 'Maritime', prefecture: 'Agoè-Nyivé', latitude: 6.2000, longitude: 1.2333),
    TogoCommune(nom: 'Avé 1', region: 'Maritime', prefecture: 'Avé', latitude: 6.3333, longitude: 1.0167),
    TogoCommune(nom: 'Avé 2', region: 'Maritime', prefecture: 'Avé', latitude: 6.3333, longitude: 1.0167),
    TogoCommune(nom: 'Bas-Mono 1', region: 'Maritime', prefecture: 'Bas-Mono', latitude: 6.4500, longitude: 1.5500),
    TogoCommune(nom: 'Bas-Mono 2', region: 'Maritime', prefecture: 'Bas-Mono', latitude: 6.4500, longitude: 1.5500),
    TogoCommune(nom: 'Golfe 1', region: 'Maritime', prefecture: 'Golfe', latitude: 6.1319, longitude: 1.2225),
    TogoCommune(nom: 'Golfe 2', region: 'Maritime', prefecture: 'Golfe', latitude: 6.1319, longitude: 1.2225),
    TogoCommune(nom: 'Golfe 3', region: 'Maritime', prefecture: 'Golfe', latitude: 6.1319, longitude: 1.2225),
    TogoCommune(nom: 'Golfe 4', region: 'Maritime', prefecture: 'Golfe', latitude: 6.1319, longitude: 1.2225),
    TogoCommune(nom: 'Golfe 5', region: 'Maritime', prefecture: 'Golfe', latitude: 6.1319, longitude: 1.2225),
    TogoCommune(nom: 'Golfe 6', region: 'Maritime', prefecture: 'Golfe', latitude: 6.1319, longitude: 1.2225),
    TogoCommune(nom: 'Golfe 7', region: 'Maritime', prefecture: 'Golfe', latitude: 6.1319, longitude: 1.2225),
    TogoCommune(nom: 'Lacs 1', region: 'Maritime', prefecture: 'Lacs', latitude: 6.2333, longitude: 1.6333),
    TogoCommune(nom: 'Lacs 2', region: 'Maritime', prefecture: 'Lacs', latitude: 6.2333, longitude: 1.6333),
    TogoCommune(nom: 'Lacs 3', region: 'Maritime', prefecture: 'Lacs', latitude: 6.2333, longitude: 1.6333),
    TogoCommune(nom: 'Lacs 4', region: 'Maritime', prefecture: 'Lacs', latitude: 6.2333, longitude: 1.6333),
    TogoCommune(nom: 'Vo 1', region: 'Maritime', prefecture: 'Vo', latitude: 6.3333, longitude: 1.5167),
    TogoCommune(nom: 'Vo 2', region: 'Maritime', prefecture: 'Vo', latitude: 6.3333, longitude: 1.5167),
    TogoCommune(nom: 'Vo 3', region: 'Maritime', prefecture: 'Vo', latitude: 6.3333, longitude: 1.5167),
    TogoCommune(nom: 'Vo 4', region: 'Maritime', prefecture: 'Vo', latitude: 6.3333, longitude: 1.5167),
    TogoCommune(nom: 'Yoto 1', region: 'Maritime', prefecture: 'Yoto', latitude: 6.6667, longitude: 1.5167),
    TogoCommune(nom: 'Yoto 2', region: 'Maritime', prefecture: 'Yoto', latitude: 6.6667, longitude: 1.5167),
    TogoCommune(nom: 'Yoto 3', region: 'Maritime', prefecture: 'Yoto', latitude: 6.6667, longitude: 1.5167),
    TogoCommune(nom: 'Zio 1', region: 'Maritime', prefecture: 'Zio', latitude: 6.4167, longitude: 1.2333),
    TogoCommune(nom: 'Zio 2', region: 'Maritime', prefecture: 'Zio', latitude: 6.4167, longitude: 1.2333),
    TogoCommune(nom: 'Zio 3', region: 'Maritime', prefecture: 'Zio', latitude: 6.4167, longitude: 1.2333),
    TogoCommune(nom: 'Zio 4', region: 'Maritime', prefecture: 'Zio', latitude: 6.4167, longitude: 1.2333),
  ];

  /// Retourne uniquement les noms triés alphabétiquement.
  static List<String> get noms => all.map((c) => c.nom).toList()..sort();

  /// Trouve une commune par son nom.
  static TogoCommune? trouverParNom(String nom) {
    try {
      return all.firstWhere((c) => c.nom == nom);
    } catch (_) {
      return null;
    }
  }
}
