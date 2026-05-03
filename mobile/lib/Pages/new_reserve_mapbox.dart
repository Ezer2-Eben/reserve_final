import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:uuid/uuid.dart';
import 'package:latlong2/latlong.dart';
import '../models/reserve_point.dart';
import '../models/reserve.dart';
import '../services/location_service.dart';
import '../services/geometry_service.dart';
import '../services/reserve_service.dart';
import '../config/mapbox_config.dart';

enum ItineranceState { idle, recording, finished }

class NewReserveMapbox extends StatefulWidget {
  const NewReserveMapbox({super.key});

  @override
  State<NewReserveMapbox> createState() => _NewReserveMapboxState();
}

class _NewReserveMapboxState extends State<NewReserveMapbox>
    with TickerProviderStateMixin {
  MapboxMap? _mapboxMap;
  final List<ReservePoint> _points = [];

  ItineranceState _state = ItineranceState.idle;
  bool _isTracking = false;
  geo.Position? _currentPosition;
  StreamSubscription<geo.Position>? _positionStream;

  // États UI
  bool _showStats = true;
  bool _is3DMode = true;
  String _currentStyle = MapboxConfig.satelliteStreets;

  // Animations
  late AnimationController _pulseController;
  late AnimationController _buttonController;

  // Mapbox Managers
  PointAnnotationManager? _pointAnnotationManager;
  PolylineAnnotationManager? _polylineAnnotationManager;
  PolygonAnnotationManager? _polygonAnnotationManager;

  final List<PointAnnotation> _pointAnnotations = [];
  final List<PolylineAnnotation> _polylineAnnotations = [];
  final List<PolygonAnnotation> _polygonAnnotations = [];
  PointAnnotation? _userLocationAnnotation;

  @override
  void initState() {
    super.initState();
    _initializeLocation();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _buttonController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
  }

  Future<void> _initializeLocation() async {
    bool hasPermission = await LocationService.checkAndRequestPermissions();
    if (!hasPermission) {
      _showError('Permission de localisation refusée');
      return;
    }

    geo.Position? position = await LocationService.getCurrentPosition();
    if (position != null) {
      setState(() => _currentPosition = position);
    }
    
    // Démarrer le stream GPS immédiatement pour le marker utilisateur
    _startGpsStream();
  }

  void _startGpsStream() {
    _positionStream?.cancel();
    _positionStream = LocationService.getPositionStream().listen(
      (geo.Position position) async {
        setState(() => _currentPosition = position);
        await _updateUserLocationMarker(position);

        if (_state == ItineranceState.recording) {
          await _updateMapAnnotations(); // Pour le trait "live"
        }
      },
      onError: (e) => _showError("Erreur GPS: $e"),
    );
  }

  void _onMapCreated(MapboxMap mapboxMap) async {
    _mapboxMap = mapboxMap;
    await Future.delayed(const Duration(milliseconds: 500));

    _pointAnnotationManager =
        await _mapboxMap!.annotations.createPointAnnotationManager();
    _polylineAnnotationManager =
        await _mapboxMap!.annotations.createPolylineAnnotationManager();
    _polygonAnnotationManager =
        await _mapboxMap!.annotations.createPolygonAnnotationManager();

    if (_currentPosition != null) {
      _centerMapOnPosition(_currentPosition!, animate: false);
    } else {
      await _mapboxMap!.setCamera(CameraOptions(
        center: Point(coordinates: Position(1.2225, 6.1319)),
        zoom: 15.0,
        pitch: _is3DMode ? 60.0 : 0.0,
      ));
    }
  }

  Future<void> _centerMapOnPosition(geo.Position position,
      {bool animate = true}) async {
    if (_mapboxMap == null) return;
    final cameraOptions = CameraOptions(
      center:
          Point(coordinates: Position(position.longitude, position.latitude)),
      zoom: 18.0,
      pitch: _is3DMode ? 60.0 : 0.0,
    );

    if (animate) {
      await _mapboxMap!.flyTo(
          cameraOptions, MapAnimationOptions(duration: 1500, startDelay: 0));
    } else {
      await _mapboxMap!.setCamera(cameraOptions);
    }
  }

  // 🏁 Étape 1 : Commencer l'itinérance (Ajoute Point A)
  void _startItinerance() async {
    if (_currentPosition == null) {
      _showError("Attente de position GPS...");
      return;
    }

    setState(() {
      _state = ItineranceState.recording;
      _points.clear();
    });

    await _addPointInternal("A");
    _showSuccess("Itinérance démarrée. Point A enregistré.");
    _centerMapOnPosition(_currentPosition!);
  }

  // ➕ Étape 2 : Ajouter un point intermédiaire (B, C, D...)
  void _addPoint() async {
    if (_state != ItineranceState.recording) return;

    if (_currentPosition == null) {
      _showError("Position GPS non disponible");
      return;
    }

    String label = String.fromCharCode(65 + _points.length); // A, B, C...
    await _addPointInternal(label);
    _showSuccess("Point $label ajouté");
  }

  Future<void> _addPointInternal(String label) async {
    final point = ReservePoint(
      id: const Uuid().v4(),
      coordinates: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
      accuracy: _currentPosition!.accuracy,
      timestamp: DateTime.now(),
      order: _points.length + 1,
    );

    setState(() {
      _points.add(point);
    });

    await _updateMapAnnotations();
    _buttonController.forward().then((_) => _buttonController.reverse());
  }

  // ✅ Étape 3 : Terminer et Fermer
  void _finishItinerance() async {
    if (_points.length < 3) {
      _showError("Il faut au moins 3 points (A, B, C) pour fermer une zone");
      return;
    }

    setState(() {
      _state = ItineranceState.finished;
    });

    await _updateMapAnnotations();
    _showSuccess("Zone délimitée ! Prêt pour la sauvegarde.");
  }

  Future<void> _updateUserLocationMarker(geo.Position position) async {
    if (_pointAnnotationManager == null) return;
    final point =
        Point(coordinates: Position(position.longitude, position.latitude));

    if (_userLocationAnnotation == null) {
      _userLocationAnnotation = await _pointAnnotationManager!.create(
        PointAnnotationOptions(
          geometry: point,
          iconImage: "my-location",
          iconSize: 1.2,
          iconColor: Colors.blue.value,
        ),
      );
    } else {
      _userLocationAnnotation!.geometry = point;
      await _pointAnnotationManager!.update(_userLocationAnnotation!);
    }
  }

  Future<void> _updateMapAnnotations() async {
    if (_pointAnnotationManager == null) return;

    // Supprimer les anciennes annotations (sauf utilisateur)
    for (var a in _pointAnnotations) {
      await _pointAnnotationManager!.delete(a);
    }
    _pointAnnotations.clear();
    for (var a in _polylineAnnotations) {
      await _polylineAnnotationManager!.delete(a);
    }
    _polylineAnnotations.clear();
    for (var a in _polygonAnnotations) {
      await _polygonAnnotationManager!.delete(a);
    }
    _polygonAnnotations.clear();

    // 1. Points (A, B, C...)
    for (int i = 0; i < _points.length; i++) {
      String label = String.fromCharCode(65 + i);
      final p = _points[i];
      final annot = await _pointAnnotationManager!.create(
        PointAnnotationOptions(
          geometry:
              Point(coordinates: Position(p.coordinates.longitude, p.coordinates.latitude)),
          iconSize: 1.5,
          iconColor: i == 0 ? Colors.green.value : Colors.red.value,
          textField: label,
          textSize: 14.0,
          textColor: Colors.white.value,
          textOffset: [0.0, -1.2],
        ),
      );
      _pointAnnotations.add(annot);
    }

    // 2. Lignes
    if (_points.isNotEmpty) {
      List<Position> coords = _points
          .map((p) => Position(p.coordinates.longitude, p.coordinates.latitude))
          .toList();

      // Trait "live" vers la position actuelle si on enregistre
      if (_state == ItineranceState.recording && _currentPosition != null) {
        coords.add(Position(_currentPosition!.longitude, _currentPosition!.latitude));
      }

      if (coords.length > 1) {
        final line = await _polylineAnnotationManager!.create(PolylineAnnotationOptions(
          geometry: LineString(coordinates: coords),
          lineColor: _state == ItineranceState.finished ? Colors.green.value : Colors.blue.value,
          lineWidth: 4.0,
          // lineDasharray non supporté dans cette version de Mapbox Flutter
        ));
        _polylineAnnotations.add(line);
      }

      // 3. Polygone (si fini)
      if (_state == ItineranceState.finished && _points.length >= 3) {
        List<Position> polyCoords = _points
            .map((p) => Position(p.coordinates.longitude, p.coordinates.latitude))
            .toList();
        polyCoords.add(polyCoords.first); // Fermer

        final poly = await _polygonAnnotationManager!.create(PolygonAnnotationOptions(
          geometry: Polygon(coordinates: [polyCoords]),
          fillColor: Colors.green.withOpacity(0.3).value,
          fillOutlineColor: Colors.green.value,
        ));
        _polygonAnnotations.add(poly);
      }
    }
  }

  void _saveReserve() async {
    if (_state != ItineranceState.finished) return;

    final nameController = TextEditingController(text: "Réserve ${DateTime.now().hour}h${DateTime.now().minute}");
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Nom de la réserve"),
        content: TextField(controller: nameController, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Annuler")),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, nameController.text), child: const Text("Sauvegarder")),
        ],
      ),
    );

    if (name == null || name.isEmpty) return;

    final reserve = Reserve(
      id: const Uuid().v4(),
      name: name,
      points: List.from(_points),
      area: GeometryService.calculateArea(_points),
      perimeter: GeometryService.calculatePerimeter(_points, true),
      createdAt: DateTime.now(),
      isClosed: true,
    );

    final result = await ReserveService.saveReserve(reserve);
    _showSuccess(result.userMessage);
    if (mounted) Navigator.pop(context);
  }

  void _reset() {
    setState(() {
      _state = ItineranceState.idle;
      _points.clear();
    });
    _updateMapAnnotations();
  }

  void _showError(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m), backgroundColor: Colors.red));
  void _showSuccess(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m), backgroundColor: Colors.green));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text("Itinérance Temps Réel", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Stack(
        children: [
          MapWidget(
            key: const ValueKey("map"),
            styleUri: _currentStyle,
            onMapCreated: _onMapCreated,
          ),
          if (_showStats && _points.isNotEmpty) _buildStatsPanel(),
          _buildMapControls(),
          _buildBottomPanel(),
        ],
      ),
    );
  }

  Widget _buildStatsPanel() {
    return Positioned(
      top: 100, left: 16, right: 16,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.black87, borderRadius: BorderRadius.circular(16)),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _stat("Points", "${_points.length}"),
            _stat("Périmètre", "${GeometryService.calculatePerimeter(_points, _state == ItineranceState.finished).toStringAsFixed(1)}m"),
            if (_state == ItineranceState.finished)
              _stat("Surface", "${GeometryService.calculateArea(_points).toStringAsFixed(1)}m²"),
          ],
        ),
      ),
    );
  }

  Widget _stat(String l, String v) => Column(children: [
    Text(l, style: const TextStyle(color: Colors.white70, fontSize: 12)),
    Text(v, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
  ]);

  Widget _buildMapControls() {
    return Positioned(
      right: 16, top: 160,
      child: Column(
        children: [
          _mapBtn(Icons.my_location, () => _centerMapOnPosition(_currentPosition!)),
          const SizedBox(height: 12),
          _mapBtn(_is3DMode ? Icons.threed_rotation : Icons.map, () {
            setState(() => _is3DMode = !_is3DMode);
            _centerMapOnPosition(_currentPosition!);
          }),
        ],
      ),
    );
  }

  Widget _mapBtn(IconData i, VoidCallback o) => FloatingActionButton.small(
    onPressed: o, backgroundColor: Colors.white, child: Icon(i, color: Colors.black87),
  );

  Widget _buildBottomPanel() {
    return Positioned(
      bottom: 0, left: 0, right: 0,
      child: Container(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, spreadRadius: 5)],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_state == ItineranceState.idle)
              _actionBtn("COMMENCER", Colors.green, Icons.play_arrow, _startItinerance),
            if (_state == ItineranceState.recording) ...[
              _actionBtn("AJOUTER POINT (${String.fromCharCode(65+_points.length)})", Colors.blue, Icons.add_location, _addPoint),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _actionBtn("ANNULER", Colors.red, Icons.close, _reset, outline: true)),
                const SizedBox(width: 12),
                Expanded(child: _actionBtn("TERMINER", Colors.orange, Icons.check, _finishItinerance)),
              ]),
            ],
            if (_state == ItineranceState.finished) ...[
              _actionBtn("SAUVEGARDER", Colors.green, Icons.save, _saveReserve),
              const SizedBox(height: 12),
              _actionBtn("RECOMMENCER", Colors.grey, Icons.refresh, _reset, outline: true),
            ],
          ],
        ),
      ),
    );
  }

  Widget _actionBtn(String t, Color c, IconData i, VoidCallback o, {bool outline = false}) {
    return SizedBox(
      width: double.infinity, height: 56,
      child: outline
        ? OutlinedButton.icon(onPressed: o, icon: Icon(i), label: Text(t), style: OutlinedButton.styleFrom(foregroundColor: c, side: BorderSide(color: c), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))))
        : ElevatedButton.icon(onPressed: o, icon: Icon(i), label: Text(t), style: ElevatedButton.styleFrom(backgroundColor: c, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)))),
    );
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    _pulseController.dispose();
    _buttonController.dispose();
    super.dispose();
  }
}