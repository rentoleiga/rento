import 'package:flutter/material.dart';
import 'api.dart';

class AuthState extends ChangeNotifier {
  Map<String, dynamic>? user;

  Future<void> init() async {
    await api.loadToken();
    await refresh();
  }

  Future<void> refresh() async {
    try {
      final data = await api.get('/auth/me');
      user = data['user'] as Map<String, dynamic>?;
    } catch (_) {
      user = null;
    }
    notifyListeners();
  }

  bool get loggedIn => user != null;

  Future<void> login(String email, String password) async {
    final data = await api.post('/auth/login', {'email': email, 'password': password});
    await api.persistToken(data['token']);
    user = data['user'] as Map<String, dynamic>?;
    notifyListeners();
  }

  Future<void> register(Map<String, dynamic> payload) async {
    final data = await api.post('/auth/register', payload);
    await api.persistToken(data['token']);
    user = data['user'] as Map<String, dynamic>?;
    notifyListeners();
  }

  Future<void> logout() async {
    await api.persistToken(null);
    user = null;
    notifyListeners();
  }
}

AuthState auth = AuthState();

double ratingOf(Map<String, dynamic>? m, [String key = 'rating']) {
  if (m == null) return 0;
  final v = m[key];
  if (v is num) return v.toDouble();
  return double.tryParse('$v') ?? 0;
}

Widget stars(double rating, {double size = 16}) {
  final r = rating.clamp(0, 5);
  return Row(
    mainAxisSize: MainAxisSize.min,
    children: List.generate(5, (i) => Icon(
      i < r.round() ? Icons.star : Icons.star_border,
      size: size,
      color: const Color(0xFFF5A623),
    )),
  );
}