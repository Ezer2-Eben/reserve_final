import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/reserve.dart';
import 'api_service.dart';

/// Service de gestion des réserves.
///
/// Stratégie :
///   1. Tente d'abord d'envoyer/récupérer depuis le backend via HTTP.
///   2. En cas d'échec réseau, utilise SharedPreferences comme cache local.
///   3. Les réserves sauvegardées hors-ligne sont marquées [pendingSync: true]
///      pour être synchronisées au prochain réseau disponible.
class ReserveService {
  static const String _reservesKey = 'saved_reserves';
  static const String _pendingKey = 'pending_reserves';

  static final ApiService _api = ApiService();

  // ─── Sauvegarder une réserve ───────────────────────────────────────────────

  /// Sauvegarde une réserve :
  ///   • Envoie au backend si le réseau est disponible.
  ///   • Sinon, stocke localement et marque comme "en attente de sync".
  static Future<SaveResult> saveReserve(Reserve reserve) async {
    // Tentative d'envoi au backend
    final serverResponse = await _api.postReserve(reserve);

    if (serverResponse != null) {
      // ✅ Sauvegarde en BD réussie
      await _saveToLocalCache(reserve, synced: true);
      print('[ReserveService] ✅ Réserve "${reserve.name}" sauvegardée en BD (id: ${serverResponse['id']})');
      return SaveResult.success(serverId: serverResponse['id']?.toString());
    } else {
      // ❌ Pas de réseau → cache local
      await _saveToLocalCache(reserve, synced: false);
      await _addToPending(reserve);
      print('[ReserveService] ⚠️ Hors-ligne: "${reserve.name}" sauvegardée localement (sera sync plus tard)');
      return SaveResult.offlineSaved();
    }
  }

  // ─── Récupérer les réserves ────────────────────────────────────────────────

  /// Récupère les réserves :
  ///   • Depuis le backend si disponible (source de vérité).
  ///   • Sinon depuis le cache local.
  static Future<List<Reserve>> getReserves() async {
    try {
      final isOnline = await _api.isServerReachable();

      if (isOnline) {
        // Synchroniser les réserves en attente d'abord
        await _syncPendingReserves();
        // Retourner le cache local (qui reflète ce qu'on a posté)
        return await _getFromLocalCache();
      }
    } catch (_) {}

    // En mode hors-ligne : retourner le cache local
    return await _getFromLocalCache();
  }

  // ─── Synchronisation des réserves hors-ligne ──────────────────────────────

  /// Synchronise les réserves sauvegardées hors-ligne vers le backend.
  static Future<void> syncPendingReserves() async {
    await _syncPendingReserves();
  }

  static Future<void> _syncPendingReserves() async {
    final pending = await _getPendingReserves();
    if (pending.isEmpty) return;

    print('[ReserveService] 🔄 Synchronisation de ${pending.length} réserve(s) en attente...');
    final List<Reserve> stillPending = [];

    for (final reserve in pending) {
      final result = await _api.postReserve(reserve);
      if (result != null) {
        print('[ReserveService] ✅ Sync réussie: "${reserve.name}"');
      } else {
        stillPending.add(reserve); // Garder pour la prochaine tentative
      }
    }

    // Mise à jour de la liste des réserves en attente
    await _savePendingReserves(stillPending);
  }

  // ─── Opérations CRUD locales ──────────────────────────────────────────────

  /// Supprime une réserve par ID (localement seulement pour l'instant).
  static Future<void> deleteReserve(String reserveId) async {
    final prefs = await SharedPreferences.getInstance();
    final reserves = await _getFromLocalCache();
    reserves.removeWhere((r) => r.id == reserveId);
    final json = reserves.map((r) => r.toJson()).toList();
    await prefs.setString(_reservesKey, jsonEncode(json));
  }

  /// Récupère une réserve par son ID.
  static Future<Reserve?> getReserveById(String reserveId) async {
    final reserves = await getReserves();
    return reserves.where((r) => r.id == reserveId).firstOrNull;
  }

  // ─── Cache local (SharedPreferences) ──────────────────────────────────────

  static Future<void> _saveToLocalCache(Reserve reserve, {required bool synced}) async {
    final prefs = await SharedPreferences.getInstance();
    final reserves = await _getFromLocalCache();

    final idx = reserves.indexWhere((r) => r.id == reserve.id);
    if (idx >= 0) {
      reserves[idx] = reserve;
    } else {
      reserves.add(reserve);
    }

    final json = reserves.map((r) => r.toJson()).toList();
    await prefs.setString(_reservesKey, jsonEncode(json));
  }

  static Future<List<Reserve>> _getFromLocalCache() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_reservesKey);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list.map((j) => Reserve.fromJson(j)).toList();
  }

  // ─── File d'attente hors-ligne (réserves non-synchronisées) ──────────────

  static Future<void> _addToPending(Reserve reserve) async {
    final pending = await _getPendingReserves();
    if (!pending.any((r) => r.id == reserve.id)) {
      pending.add(reserve);
    }
    await _savePendingReserves(pending);
  }

  static Future<List<Reserve>> _getPendingReserves() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_pendingKey);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list.map((j) => Reserve.fromJson(j)).toList();
  }

  static Future<void> _savePendingReserves(List<Reserve> reserves) async {
    final prefs = await SharedPreferences.getInstance();
    final json = reserves.map((r) => r.toJson()).toList();
    await prefs.setString(_pendingKey, jsonEncode(json));
  }

  /// Retourne le nombre de réserves en attente de synchronisation.
  static Future<int> getPendingCount() async {
    final pending = await _getPendingReserves();
    return pending.length;
  }
}

/// Résultat d'une opération de sauvegarde.
class SaveResult {
  final bool savedOnServer;
  final bool savedLocally;
  final String? serverId;

  SaveResult._({
    required this.savedOnServer,
    required this.savedLocally,
    this.serverId,
  });

  factory SaveResult.success({String? serverId}) => SaveResult._(
        savedOnServer: true,
        savedLocally: true,
        serverId: serverId,
      );

  factory SaveResult.offlineSaved() => SaveResult._(
        savedOnServer: false,
        savedLocally: true,
      );

  /// Message à afficher à l'utilisateur.
  String get userMessage {
    if (savedOnServer) {
      return 'Réserve sauvegardée avec succès !';
    } else {
      return 'Sauvegardée localement (sera envoyée au serveur dès connexion disponible)';
    }
  }
}