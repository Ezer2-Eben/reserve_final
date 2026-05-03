import 'package:flutter/material.dart';
import 'package:reserve/Pages/connexion.dart';

class Signup extends StatefulWidget {
  const Signup({super.key});

  @override
  State<Signup> createState() => _SignupState();
}

class _SignupState extends State<Signup> {
  final TextEditingController usernameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    usernameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          child: Container(
            margin: const EdgeInsets.all(30),
            padding: const EdgeInsets.only(top: 30),
            child: Column(
              children: [
                const Text("Inscription", style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold)),
                const Text('Créez votre compte (Simulé)'),
                const SizedBox(height: 25),
                Form(
                  child: Column(
                    children: [
                      TextField(controller: usernameController, decoration: const InputDecoration(labelText: "Nom d'utilisateur")),
                      TextField(controller: emailController, decoration: const InputDecoration(labelText: "Email")),
                      TextField(controller: passwordController, decoration: const InputDecoration(labelText: "Mot de passe"), obscureText: true),
                      TextField(controller: confirmPasswordController, decoration: const InputDecoration(labelText: "Confirmer"), obscureText: true),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            // Navigation directe vers connexion pour simuler la fin d'inscription
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(builder: (_) => const Connexion()),
                            );
                          },
                          child: const Text("S'inscrire"),
                        ),
                      ),
                      const SizedBox(height: 15),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text("Déjà un compte ? "),
                          GestureDetector(
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const Connexion()));
                            },
                            child: const Text("Connectez-vous", style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}