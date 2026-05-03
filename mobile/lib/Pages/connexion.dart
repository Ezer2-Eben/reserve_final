import 'package:flutter/material.dart';
import '../pages/home.dart';
import '../services/auth_service.dart';
import '../config/togo_communes_data.dart';
import '../widgets/input.dart';

class Connexion extends StatefulWidget {
  const Connexion({super.key});

  @override
  State<Connexion> createState() => _ConnexionState();
}

class _ConnexionState extends State<Connexion>
    with SingleTickerProviderStateMixin {
  final TextEditingController usernameController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final AuthService _authService = AuthService();

  String? _selectedCommune;
  bool _isLoading = false;
  String? _errorMessage;

  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();
    _fadeAnim = CurvedAnimation(
        parent: _animController, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    usernameController.dispose();
    passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final success = await _authService.login(
      usernameController.text,
      passwordController.text,
      commune: _selectedCommune,
    );

    if (!mounted) return;

    setState(() => _isLoading = false);

    if (success) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const Home()),
      );
    } else {
      setState(() {
        _errorMessage = 'Identifiants incorrects. Vérifiez vos informations.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF1B5E20), Color(0xFF004D40), Color(0xFF0D47A1)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: FadeTransition(
                opacity: _fadeAnim,
                child: Card(
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24)),
                  elevation: 16,
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Logo
                          Container(
                            width: 80,
                            height: 80,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [Color(0xFF1B5E20), Color(0xFF0D47A1)],
                              ),
                            ),
                            child: const Icon(Icons.map_outlined,
                                color: Colors.white, size: 44),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Réserves Administratives',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1B5E20),
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Togo – Délimitation de terrains',
                            style: TextStyle(
                                fontSize: 13, color: Colors.grey),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 28),

                          // Champ username
                          Input(
                            label: 'Nom d\'utilisateur',
                            hint: 'Entrez votre identifiant',
                            controller: usernameController,
                            validator: (v) =>
                                (v == null || v.trim().isEmpty)
                                    ? 'Champ obligatoire'
                                    : null,
                          ),
                          const SizedBox(height: 8),

                          // Champ password
                          Input(
                            label: 'Mot de passe',
                            hint: '••••••••',
                            controller: passwordController,
                            obscureText: true,
                            validator: (v) =>
                                (v == null || v.trim().isEmpty)
                                    ? 'Champ obligatoire'
                                    : null,
                          ),
                          const SizedBox(height: 16),

                          // Sélection de la commune du Togo
                          DropdownButtonFormField<String>(
                            value: _selectedCommune,
                            decoration: InputDecoration(
                              labelText: 'Commune (optionnel)',
                              prefixIcon: const Icon(Icons.location_city,
                                  color: Color(0xFF1B5E20)),
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12)),
                              filled: true,
                              fillColor: Colors.grey[50],
                            ),
                            hint: const Text('Sélectionnez votre commune'),
                            isExpanded: true,
                            items: TogoCommunes.noms.map((nom) {
                              final commune = TogoCommunes.trouverParNom(nom);
                              return DropdownMenuItem(
                                value: nom,
                                child: Text(
                                  commune != null
                                      ? '$nom (${commune.prefecture})'
                                      : nom,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                            onChanged: (val) =>
                                setState(() => _selectedCommune = val),
                          ),
                          const SizedBox(height: 24),

                          // Message d'erreur
                          if (_errorMessage != null)
                            Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                    color: Colors.red.shade200),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline,
                                      color: Colors.red, size: 18),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _errorMessage!,
                                      style: const TextStyle(
                                          color: Colors.red,
                                          fontSize: 13),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                          // Bouton connexion
                          SizedBox(
                            width: double.infinity,
                            height: 50,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _handleLogin,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1B5E20),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14)),
                                elevation: 4,
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 22,
                                      width: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text(
                                      'Se connecter',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}