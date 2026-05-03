import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import '../models/reserve.dart';
import '../services/reserve_service.dart';

class MyReservesPage extends StatefulWidget {
  const MyReservesPage({super.key});

  @override
  State<MyReservesPage> createState() => _MyReservesPageState();
}

class _MyReservesPageState extends State<MyReservesPage> {
  List<Reserve> _reserves = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReserves();
  }

  Future<void> _loadReserves() async {
    setState(() => _isLoading = true);
    final reserves = await ReserveService.getReserves();
    setState(() {
      _reserves = reserves;
      _isLoading = false;
    });
  }

  Future<void> _deleteReserve(Reserve reserve) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer la réserve'),
        content: Text('Voulez-vous vraiment supprimer "${reserve.name}" ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ReserveService.deleteReserve(reserve.id);
      await _loadReserves();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Réserve supprimée')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes Réserves'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _reserves.isEmpty
              ? _buildEmptyState()
              : _buildReservesList(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.map_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'Aucune réserve sauvegardée',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Créez votre première réserve pour la voir ici',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReservesList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _reserves.length,
      itemBuilder: (context, index) {
        final reserve = _reserves[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Mini carte
              SizedBox(
                height: 150,
                child: ReserveMiniMap(reserve: reserve),
              ),
              // Informations
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            reserve.name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () => _deleteReserve(reserve),
                          icon: const Icon(Icons.delete, color: Colors.red),
                          tooltip: 'Supprimer',
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${reserve.points.length} points',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Surface: ${reserve.area.toStringAsFixed(2)} m²',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Périmètre: ${reserve.perimeter.toStringAsFixed(2)} m',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Créée le: ${_formatDate(reserve.createdAt)}',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}

// Widget pour afficher une mini carte avec la zone
class ReserveMiniMap extends StatefulWidget {
  final Reserve reserve;

  const ReserveMiniMap({super.key, required this.reserve});

  @override
  State<ReserveMiniMap> createState() => _ReserveMiniMapState();
}

class _ReserveMiniMapState extends State<ReserveMiniMap> {
  MapboxMap? _mapboxMap;
  PolygonAnnotationManager? _polygonAnnotationManager;

  @override
  Widget build(BuildContext context) {
    return MapWidget(
      key: ValueKey('mini_map_${widget.reserve.id}'),
      styleUri: MapboxStyles.SATELLITE_STREETS,
      cameraOptions: _getCameraOptions(),
      onMapCreated: _onMapCreated,
    );
  }

  CameraOptions _getCameraOptions() {
    if (widget.reserve.points.isEmpty) {
      return CameraOptions(
        center: Point(coordinates: Position(2.0, 46.0)), // Centre de la France
        zoom: 5.0,
      );
    }

    // Calculer le centre de la réserve
    double minLat = double.infinity;
    double maxLat = double.negativeInfinity;
    double minLng = double.infinity;
    double maxLng = double.negativeInfinity;

    for (final point in widget.reserve.points) {
      minLat = minLat < point.coordinates.latitude ? minLat : point.coordinates.latitude;
      maxLat = maxLat > point.coordinates.latitude ? maxLat : point.coordinates.latitude;
      minLng = minLng < point.coordinates.longitude ? minLng : point.coordinates.longitude;
      maxLng = maxLng > point.coordinates.longitude ? maxLng : point.coordinates.longitude;
    }

    final centerLat = (minLat + maxLat) / 2;
    final centerLng = (minLng + maxLng) / 2;

    return CameraOptions(
      center: Point(coordinates: Position(centerLng, centerLat)),
      zoom: 14.0,
    );
  }

  void _onMapCreated(MapboxMap mapboxMap) async {
    _mapboxMap = mapboxMap;

    // Créer le gestionnaire de polygones
    _polygonAnnotationManager = await _mapboxMap!.annotations.createPolygonAnnotationManager();

    // Créer le polygone
    if (widget.reserve.points.length >= 3) {
      final coordinates = widget.reserve.points
          .map((point) => Position(point.coordinates.longitude, point.coordinates.latitude))
          .toList();
      coordinates.add(coordinates.first); // Fermer le polygone

      await _polygonAnnotationManager!.create(
        PolygonAnnotationOptions(
          geometry: Polygon(coordinates: [coordinates]),
          fillColor: Colors.blue.withOpacity(0.5).value,
          fillOutlineColor: Colors.blue.value,
        ),
      );
    }
  }
}