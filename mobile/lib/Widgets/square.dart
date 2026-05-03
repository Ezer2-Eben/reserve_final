import 'package:flutter/material.dart';

class Square extends StatelessWidget {
  final String path;

  const Square({super.key, required this.path});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey),
        borderRadius: BorderRadius.circular(16),
        color: Colors.grey[200],
      ),

      child: Image.asset(path, height: 20),
    );
  }
}
