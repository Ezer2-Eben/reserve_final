import 'package:flutter/material.dart';

class Input extends StatelessWidget {
  final String label;
  final String hint;
  final TextEditingController controller;
  final bool obscureText;
  final String? Function(String?)? validator;

  const Input({
    super.key,
    required this.label,
    required this.hint,
    this.obscureText = false,
    required this.controller,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(top: 10),
      child: TextFormField(
        style: TextStyle(fontSize: 10),

        controller: controller,
        obscureText: obscureText,

        decoration: InputDecoration(
          label: Text(label),
          hintText: hint,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
        ),
        validator: validator ?? (value) {
          if (value == null || value.isEmpty) {
            return "veuillez saisir votre $label";
          }
          return null;
        },
      ),
    );
  }
}
