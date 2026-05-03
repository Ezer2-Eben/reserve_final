import 'package:latlong2/latlong.dart';

class ReservePoint {
  final String id;
  final LatLng coordinates;
  final double? accuracy;
  final DateTime timestamp;
  final int order;

  ReservePoint({
    required this.id,
    required this.coordinates,
    this.accuracy,
    required this.timestamp,
    required this.order,
  });

  // Convertir en JSON pour stockage
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'latitude': coordinates.latitude,
      'longitude': coordinates.longitude,
      'accuracy': accuracy,
      'timestamp': timestamp.toIso8601String(),
      'order': order,
    };
  }

  // Créer depuis JSON
  factory ReservePoint.fromJson(Map<String, dynamic> json) {
    return ReservePoint(
      id: json['id'],
      coordinates: LatLng(json['latitude'], json['longitude']),
      accuracy: json['accuracy'],
      timestamp: DateTime.parse(json['timestamp']),
      order: json['order'],
    );
  }

  @override
  String toString() {
    return 'ReservePoint(id: $id, coordinates: $coordinates, accuracy: $accuracy, timestamp: $timestamp, order: $order)';
  }
}