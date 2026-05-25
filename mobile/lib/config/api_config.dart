/// Configuration de l'API backend pour l'application mobile.
///
/// ⚠️  IMPORTANT : Remplacez [serverIp] par l'adresse IP de votre PC serveur.
///   - Sur émulateur Android  → utilisez "10.0.2.2"
///   - Sur appareil physique  → utilisez l'IP locale du PC (ex: "192.168.1.100")
///   - Utilisez ipconfig (Windows) pour trouver votre IP locale.

class ApiConfig {
  /// URL de production sur Render (ex: 'https://mon-backend.onrender.com').
  /// Laissez vide pour utiliser l'IP locale ci-dessous en développement.
  static const String productionUrl = '';

  /// Adresse IP du serveur backend Spring Boot en local.
  static const String serverIp = '192.168.1.70';

  /// Port du backend Spring Boot local.
  static const int serverPort = 9190;

  /// URL de base de l'API dynamique
  static String get baseUrl {
    if (productionUrl.isNotEmpty) {
      return productionUrl.endsWith('/') ? productionUrl.substring(0, productionUrl.length - 1) : productionUrl;
    }
    return 'http://$serverIp:$serverPort';
  }

  /// Endpoints mobiles (sans JWT)
  static String get mobileReservesUrl => '$baseUrl/api/mobile/reserves';
  static String get pingUrl => '$baseUrl/api/mobile/ping';
  static String get loginUrl => '$baseUrl/api/auth/login';

  /// Timeout pour les requêtes HTTP (en secondes)
  static const int timeoutSeconds = 10;
}
