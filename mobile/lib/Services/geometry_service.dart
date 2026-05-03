import 'dart:math';
import 'package:latlong2/latlong.dart';
import '../models/reserve_point.dart';

class GeometryService {
  // Calcul de distance Haversine entre deux points GPS
  static double calculateDistance(LatLng point1, LatLng point2) {
    const double earthRadius = 6371000; // mètres
    
    double lat1 = point1.latitude * pi / 180;
    double lat2 = point2.latitude * pi / 180;
    double deltaLat = (point2.latitude - point1.latitude) * pi / 180;
    double deltaLon = (point2.longitude - point1.longitude) * pi / 180;
    
    double a = sin(deltaLat / 2) * sin(deltaLat / 2) +
               cos(lat1) * cos(lat2) *
               sin(deltaLon / 2) * sin(deltaLon / 2);
    
    double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    
    return earthRadius * c;
  }

  // Calcul du périmètre d'un polygone
  static double calculatePerimeter(List<ReservePoint> points, bool isClosed) {
    if (points.length < 2) return 0;
    
    double total = 0;
    
    for (int i = 0; i < points.length - 1; i++) {
      total += calculateDistance(
        points[i].coordinates,
        points[i + 1].coordinates,
      );
    }
    
    // Fermeture du polygone
    if (isClosed && points.length > 2) {
      total += calculateDistance(
        points.last.coordinates,
        points.first.coordinates,
      );
    }
    
    return total;
  }

  // Calcul de surface avec formule de Shoelace adapté aux coordonnées GPS
  static double calculateArea(List<ReservePoint> points) {
    if (points.length < 3) return 0;
    
    // Conversion des coordonnées géographiques en coordonnées métriques (projection simplifiée)
    List<Map<String, double>> projectedPoints = _projectToMetric(points);
    
    // Formule de Shoelace
    double area = 0;
    int j = projectedPoints.length - 1;
    
    for (int i = 0; i < projectedPoints.length; i++) {
      area += (projectedPoints[j]['x']! + projectedPoints[i]['x']!) *
              (projectedPoints[j]['y']! - projectedPoints[i]['y']!);
      j = i;
    }
    
    return (area.abs() / 2.0);
  }

  // Projection simple en coordonnées métriques
  static List<Map<String, double>> _projectToMetric(List<ReservePoint> points) {
    if (points.isEmpty) return [];
    
    // Point de référence (premier point)
    LatLng origin = points.first.coordinates;
    double latOrigin = origin.latitude * pi / 180;
    
    return points.map((point) {
      double lat = point.coordinates.latitude * pi / 180;
      double lon = point.coordinates.longitude * pi / 180;
      double lonOrigin = origin.longitude * pi / 180;
      
      // Projection équirectangulaire
      double x = (lon - lonOrigin) * cos((latOrigin + lat) / 2) * 6371000;
      double y = (lat - (origin.latitude * pi / 180)) * 6371000;
      
      return {'x': x, 'y': y};
    }).toList();
  }

  // Calcul du centre du polygone (centroïde)
  static LatLng calculateCentroid(List<ReservePoint> points) {
    if (points.isEmpty) return const LatLng(0, 0);
    
    double latitude = 0;
    double longitude = 0;
    
    for (var point in points) {
      latitude += point.coordinates.latitude;
      longitude += point.coordinates.longitude;
    }
    
    return LatLng(
      latitude / points.length,
      longitude / points.length,
    );
  }

  // Calcul des limites du polygone pour zoom automatique
  static Map<String, LatLng> calculateBounds(List<ReservePoint> points) {
    if (points.isEmpty) {
      return {
        'southwest': const LatLng(0, 0),
        'northeast': const LatLng(0, 0),
      };
    }
    
    double minLat = points.first.coordinates.latitude;
    double maxLat = points.first.coordinates.latitude;
    double minLng = points.first.coordinates.longitude;
    double maxLng = points.first.coordinates.longitude;
    
    for (var point in points) {
      if (point.coordinates.latitude < minLat) minLat = point.coordinates.latitude;
      if (point.coordinates.latitude > maxLat) maxLat = point.coordinates.latitude;
      if (point.coordinates.longitude < minLng) minLng = point.coordinates.longitude;
      if (point.coordinates.longitude > maxLng) maxLng = point.coordinates.longitude;
    }
    
    // Ajout d'une marge de 10%
    double latMargin = (maxLat - minLat) * 0.1;
    double lngMargin = (maxLng - minLng) * 0.1;
    
    return {
      'southwest': LatLng(minLat - latMargin, minLng - lngMargin),
      'northeast': LatLng(maxLat + latMargin, maxLng + lngMargin),
    };
  }

  // Formatage des distances
  static String formatDistance(double meters) {
    if (meters < 1000) {
      return '${meters.toStringAsFixed(2)} m';
    } else {
      return '${(meters / 1000).toStringAsFixed(3)} km';
    }
  }

  // Formatage des surfaces
  static String formatArea(double squareMeters) {
    if (squareMeters < 10000) {
      return '${squareMeters.toStringAsFixed(2)} m²';
    } else {
      double hectares = squareMeters / 10000;
      return '${hectares.toStringAsFixed(4)} ha';
    }
  }

  // Calcule la distance totale + la distance vers la position actuelle (live)
  static double calculateTotalDistanceWithLive(List<ReservePoint> points, LatLng currentPos) {
    if (points.isEmpty) return 0;
    
    double total = 0;
    // Distance entre les points enregistrés
    for (int i = 0; i < points.length - 1; i++) {
      total += calculateDistance(points[i].coordinates, points[i+1].coordinates);
    }
    // Ajout de la distance entre le dernier point et là où l'utilisateur se trouve
    total += calculateDistance(points.last.coordinates, currentPos);
    
    return total;
  }

  // Vérification si un point est dans le polygone (algorithme Ray Casting)
  static bool isPointInPolygon(LatLng point, List<LatLng> polygon) {
    bool inside = false;
    int j = polygon.length - 1;
    
    for (int i = 0; i < polygon.length; i++) {
      if ((polygon[i].latitude > point.latitude) != (polygon[j].latitude > point.latitude) &&
          point.longitude < (polygon[j].longitude - polygon[i].longitude) * 
          (point.latitude - polygon[i].latitude) / 
          (polygon[j].latitude - polygon[i].latitude) + polygon[i].longitude) {
        inside = !inside;
      }
      j = i;
    }
    
    return inside;
  }
}