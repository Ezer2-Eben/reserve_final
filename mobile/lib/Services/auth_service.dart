import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _usernameKey = 'username';
  static const String _communeKey = 'selected_commune';

  /// Tente une connexion réelle au backend.
  /// Retourne true si succès, false sinon.
  Future<bool> login(String username, String password,
      {String? commune}) async {
    try {
      print('[AuthService] Appel vers: ${ApiConfig.loginUrl}');
      final response = await http
          .post(
            Uri.parse(ApiConfig.loginUrl),
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            body: jsonEncode({
              'username': username.trim(),
              'password': password.trim(),
            }),
          )
          .timeout(const Duration(seconds: ApiConfig.timeoutSeconds));

      print('[AuthService] Status Code: ${response.statusCode}');
      print('[AuthService] Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final token = data['token'] as String?;
        if (token != null && token.isNotEmpty) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_tokenKey, token);
          await prefs.setString(_usernameKey, username.trim());
          if (commune != null && commune.isNotEmpty) {
            await prefs.setString(_communeKey, commune);
          }
          return true;
        }
      }
      return false;
    } catch (e) {
      print('[AuthService] Erreur de connexion: $e');
      return false;
    }
  }

  /// Récupère le token JWT stocké.
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Récupère le nom d'utilisateur connecté.
  Future<String?> getUsername() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_usernameKey);
  }

  /// Récupère la commune sélectionnée.
  Future<String?> getCommune() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_communeKey);
  }

  /// Déconnexion.
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_usernameKey);
    await prefs.remove(_communeKey);
  }

  /// Vérifie si l'utilisateur est connecté.
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}