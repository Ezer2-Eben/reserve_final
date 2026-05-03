import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:reserve/config/mapbox_config.dart';
import 'package:reserve/pages/connexion.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialisation du token Mapbox pour mobile seulement (Web utilise index.html)
  if (!kIsWeb) {
    MapboxOptions.setAccessToken(MapboxConfig.accessToken);
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Reserve Administrative',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.green),
      home: const Connexion(), // On démarre par la connexion
    );
  }
}