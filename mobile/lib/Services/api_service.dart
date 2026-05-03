import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/reserve.dart';
import '../models/reserve_point.dart';

/// Service de communication HTTP avec le backend Spring Boot.
/// Gère les appels REST vers les endpoints mobiles (/api/mobile/).
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Duration _timeout = Duration(seconds: ApiConfig.timeoutSeconds);

  // ─── Token JWT ────────────────────────────────────────────────────────────

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    };
    if (token != null && token.isNotEmpty && token != 'offline_token') {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // ─── Vérification de la connexion ────────────────────────────────────────

  Future<bool> isServerReachable() async {
    try {
      final response = await http
          .get(Uri.parse(ApiConfig.pingUrl))
          .timeout(_timeout);
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // ─── Réserves ─────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>?> postReserve(Reserve reserve) async {
    try {
      final headers = await _getHeaders();
      final body = _reserveToJson(reserve);

      final response = await http
          .post(
            Uri.parse(ApiConfig.mobileReservesUrl),
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(_timeout);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } else {
        print('[ApiService] Erreur POST reserve: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('[ApiService] Exception POST reserve: $e');
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> fetchAllReserves() async {
    try {
      final headers = await _getHeaders();
      final response = await http
          .get(Uri.parse(ApiConfig.mobileReservesUrl), headers: headers)
          .timeout(_timeout);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        print('[ApiService] Erreur GET reserves: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('[ApiService] Exception GET reserves: $e');
      return [];
    }
  }

  // ─── Conversion Flutter → JSON Backend ────────────────────────────────────

  Map<String, dynamic> _reserveToJson(Reserve reserve) {
    return {
      'mobileId': reserve.id,
      'name': reserve.name,
      'area': reserve.area,
      'perimeter': reserve.perimeter,
      'isClosed': reserve.isClosed,
      'createdAt': reserve.createdAt.toIso8601String(),
      'points': reserve.points.map((p) => _pointToJson(p)).toList(),
    };
  }

  Map<String, dynamic> _pointToJson(ReservePoint point) {
    return {
      'id': point.id,
      'latitude': point.coordinates.latitude,
      'longitude': point.coordinates.longitude,
      'accuracy': point.accuracy,
      'order': point.order,
      'timestamp': point.timestamp.toIso8601String(),
    };
  }
}
