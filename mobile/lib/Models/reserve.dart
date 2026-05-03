import 'reserve_point.dart';

class Reserve {
  final String id;
  final String name;
  final List<ReservePoint> points;
  final double area;
  final double perimeter;
  final DateTime createdAt;
  final bool isClosed;

  Reserve({
    required this.id,
    required this.name,
    required this.points,
    required this.area,
    required this.perimeter,
    required this.createdAt,
    required this.isClosed,
  });

  // Convertir en JSON pour stockage
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'points': points.map((point) => point.toJson()).toList(),
      'area': area,
      'perimeter': perimeter,
      'createdAt': createdAt.toIso8601String(),
      'isClosed': isClosed,
    };
  }

  // Créer depuis JSON
  factory Reserve.fromJson(Map<String, dynamic> json) {
    return Reserve(
      id: json['id'],
      name: json['name'],
      points: (json['points'] as List<dynamic>)
          .map((pointJson) => ReservePoint.fromJson(pointJson))
          .toList(),
      area: json['area'],
      perimeter: json['perimeter'],
      createdAt: DateTime.parse(json['createdAt']),
      isClosed: json['isClosed'],
    );
  }

  // Calculer les coordonnées pour Mapbox
  List<List<double>> getCoordinatesForMapbox() {
    return points.map((point) => [point.coordinates.longitude, point.coordinates.latitude]).toList();
  }

  @override
  String toString() {
    return 'Reserve(id: $id, name: $name, points: ${points.length}, area: $area, perimeter: $perimeter, createdAt: $createdAt)';
  }
}