import 'package:geolocator/geolocator.dart' as geo;
import 'package:latlong2/latlong.dart';
import 'package:permission_handler/permission_handler.dart';

class LocationService {
  // Vérifier et demander les permissions
  static Future<bool> checkAndRequestPermissions() async {
    PermissionStatus permission = await Permission.location.status;
    
    if (permission.isDenied) {
      permission = await Permission.location.request();
    }
    
    if (permission.isPermanentlyDenied) {
      await openAppSettings();
      return false;
    }
    
    return permission.isGranted;
  }

  // Paramètres optimisés pour le temps réel
  static geo.LocationSettings get _settings => const geo.LocationSettings(
    accuracy: geo.LocationAccuracy.bestForNavigation,
    distanceFilter: 0, // IMPORTANT: 0 pour recevoir chaque petit mouvement
  );

  // Obtenir la position actuelle avec haute précision
  static Future<geo.Position?> getCurrentPosition() async {
    try {
      bool hasPermission = await checkAndRequestPermissions();
      if (!hasPermission) return null;
      
      return await geo.Geolocator.getCurrentPosition(
        desiredAccuracy: geo.LocationAccuracy.bestForNavigation,
      );
    } catch (e) {
      print('Erreur de localisation: $e');
      return null;
    }
  }

  // Vérifier si le GPS est activé
  static Future<bool> isLocationServiceEnabled() async {
    return await geo.Geolocator.isLocationServiceEnabled();
  }

  // Convertir Position en LatLng
  static LatLng positionToLatLng(geo.Position position) {
    return LatLng(position.latitude, position.longitude);
  }

  // Stream pour suivre la position en temps réel
  static Stream<geo.Position> getPositionStream() {
    return geo.Geolocator.getPositionStream(
      locationSettings: _settings,
    );
  }

  // Calculer la qualité du signal GPS
  static String getAccuracyQuality(double accuracy) {
    if (accuracy <= 5) return 'Excellent';
    if (accuracy <= 10) return 'Très bon';
    if (accuracy <= 20) return 'Bon';
    if (accuracy <= 50) return 'Moyen';
    return 'Faible';
  }

  // Obtenir une position avec retry
  static Future<geo.Position?> getCurrentPositionWithRetry({int maxRetries = 3}) async {
    for (int i = 0; i < maxRetries; i++) {
      try {
        geo.Position? position = await getCurrentPosition();
        if (position != null) return position;
        
        // Attendre avant de réessayer
        await Future.delayed(Duration(seconds: 2 * (i + 1)));
      } catch (e) {
        print('Tentative ${i + 1}/$maxRetries échouée');
      }
    }
    return null;
  }
}