import 'package:flutter/material.dart';
import '../models/reserve_point.dart';
import '../services/geometry_service.dart';

class ReserveStatsCard extends StatelessWidget {
  final List<ReservePoint> points;
  final bool isClosed;

  const ReserveStatsCard({
    super.key,
    required this.points,
    required this.isClosed,
  });

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return _buildEmptyState();
    }

    double perimeter = GeometryService.calculatePerimeter(points, isClosed);
    double area = GeometryService.calculateArea(points);
    double avgAccuracy = points.map((p) => p.accuracy ?? 0).reduce((a, b) => a + b) / points.length;
    
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.blue.shade50,
              Colors.white,
            ],
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // En-tête
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.analytics,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Statistiques Détaillées',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 16),
            
            // Statistiques principales
            _buildStatRow(
              icon: Icons.location_on,
              label: 'Nombre de points',
              value: '${points.length}',
              color: Colors.blue,
            ),
            
            const SizedBox(height: 12),
            
            _buildStatRow(
              icon: Icons.straighten,
              label: 'Périmètre',
              value: GeometryService.formatDistance(perimeter),
              color: Colors.orange,
            ),
            
            if (isClosed) ...[
              const SizedBox(height: 12),
              _buildStatRow(
                icon: Icons.crop_square,
                label: 'Surface',
                value: GeometryService.formatArea(area),
                color: Colors.green,
                subtitle: _getAreaComparison(area),
              ),
            ],
            
            const SizedBox(height: 12),
            
            _buildStatRow(
              icon: Icons.gps_fixed,
              label: 'Précision moyenne',
              value: '±${avgAccuracy.toStringAsFixed(1)} m',
              color: _getAccuracyColor(avgAccuracy),
            ),
            
            const SizedBox(height: 12),
            
            _buildStatRow(
              icon: Icons.access_time,
              label: 'Durée de mesure',
              value: _calculateDuration(),
              color: Colors.purple,
            ),
            
            // Détails supplémentaires si polygone fermé
            if (isClosed && points.length >= 3) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              
              _buildAdvancedStats(area),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Icon(
              Icons.map_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Aucun point ajouté',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Commencez à délimiter votre réserve',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
    String? subtitle,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[600],
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                  ),
                ),
            ],
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildAdvancedStats(double area) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Conversions',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        
        _buildConversionRow('Mètres carrés', '${area.toStringAsFixed(2)} m²'),
        const SizedBox(height: 8),
        _buildConversionRow('Hectares', '${(area / 10000).toStringAsFixed(4)} ha'),
        const SizedBox(height: 8),
        _buildConversionRow('Ares', '${(area / 100).toStringAsFixed(2)} a'),
        const SizedBox(height: 8),
        _buildConversionRow('Acres', '${(area / 4046.86).toStringAsFixed(4)} ac'),
      ],
    );
  }

  Widget _buildConversionRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[700],
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  String _calculateDuration() {
    if (points.isEmpty) return '0 min';
    
    DateTime start = points.first.timestamp;
    DateTime end = points.last.timestamp;
    Duration duration = end.difference(start);
    
    if (duration.inMinutes < 1) {
      return '${duration.inSeconds} sec';
    } else if (duration.inHours < 1) {
      return '${duration.inMinutes} min';
    } else {
      return '${duration.inHours}h ${duration.inMinutes % 60}min';
    }
  }

  Color _getAccuracyColor(double accuracy) {
    if (accuracy <= 10) return Colors.green;
    if (accuracy <= 20) return Colors.orange;
    return Colors.red;
  }

  String _getAreaComparison(double squareMeters) {
    // Comparaisons amusantes pour contextualiser
    if (squareMeters < 100) {
      return '≈ Un studio';
    } else if (squareMeters < 500) {
      return '≈ Un grand appartement';
    } else if (squareMeters < 2000) {
      return '≈ Une maison avec jardin';
    } else if (squareMeters < 10000) {
      return '≈ Un terrain de football';
    } else {
      int footballFields = (squareMeters / 7140).round();
      return '≈ $footballFields terrain${footballFields > 1 ? 's' : ''} de football';
    }
  }
}