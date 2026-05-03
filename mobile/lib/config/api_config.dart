/// Configuration de l'API backend pour l'application mobile.
///
/// ⚠️  IMPORTANT : Remplacez [serverIp] par l'adresse IP de votre PC serveur.
///   - Sur émulateur Android  → utilisez "10.0.2.2"
///   - Sur appareil physique  → utilisez l'IP locale du PC (ex: "192.168.1.100")
///   - Utilisez ipconfig (Windows) pour trouver votre IP locale.

class ApiConfig {
  /// Adresse IP du serveur backend Spring Boot.
  /// Changez cette valeur selon votre configuration réseau.
  static const String serverIp = '192.168.1.70';

  /// Port du backend Spring Boot (configuré dans application.properties)
  static const int serverPort = 9190;

  /// URL de base de l'API
  static String get baseUrl => 'http://$serverIp:$serverPort';

  /// Endpoints mobiles (sans JWT)
  static String get mobileReservesUrl => '$baseUrl/api/mobile/reserves';
  static String get pingUrl => '$baseUrl/api/mobile/ping';
  static String get loginUrl => '$baseUrl/api/auth/login';

  /// Timeout pour les requêtes HTTP (en secondes)
  static const int timeoutSeconds = 10;
}
