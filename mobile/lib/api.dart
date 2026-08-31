import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String apiBase = String.fromEnvironment(
  'API_BASE',
  defaultValue: 'http://localhost:4000/api',
);

class ApiException implements Exception {
  final String message;
  final int? status;
  ApiException(this.message, [this.status]);
  @override
  String toString() => message;
}

class Api {
  final http.Client _client = http.Client();
  String? _token;

  void setToken(String? t) => _token = t;

  Map<String, String> _headers({bool json = true}) => {
        if (json) 'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<dynamic> _send(String method, String path, [Object? body]) async {
    final uri = Uri.parse('$apiBase$path');
    http.Response res;
    switch (method) {
      case 'GET':
        res = await _client.get(uri, headers: _headers());
        break;
      case 'DELETE':
        res = await _client.delete(uri, headers: _headers());
        break;
      case 'PUT':
        res = await _client.put(uri,
            headers: _headers(), body: body == null ? null : jsonEncode(body));
        break;
      default:
        res = await _client.post(uri,
            headers: _headers(), body: body == null ? null : jsonEncode(body));
    }
    dynamic data;
    try {
      data = jsonDecode(res.body.isEmpty ? '{}' : res.body);
    } catch (_) {
      data = {};
    }
    if (res.statusCode >= 400) {
      final msg = (data is Map && data['error'] != null)
          ? data['error'].toString()
          : 'Request failed (${res.statusCode})';
      throw ApiException(msg, res.statusCode);
    }
    return data;
  }

  Future<dynamic> get(String path) => _send('GET', path);
  Future<dynamic> post(String path, [Object? body]) => _send('POST', path, body);
  Future<dynamic> put(String path, [Object? body]) => _send('PUT', path, body);
  Future<dynamic> delete(String path) => _send('DELETE', path);

  Future<void> persistToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token == null) {
      await prefs.remove('rento_token');
    } else {
      await prefs.setString('rento_token', token);
    }
  }

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('rento_token');
  }
}

final Api api = Api();

String formatPrice(dynamic value, [String currency = 'ISK']) {
  final num = value is num ? value : (value is String ? double.tryParse(value) : null);
  final n = num ?? 0;
  final s = _group(n.toInt());
  return '$s ${currency == 'EUR' ? '€' : 'ISK'}';
}

String _group(int n) {
  final t = n.toString();
  final b = StringBuffer();
  for (int i = 0; i < t.length; i++) {
    if (i > 0 && (t.length - i) % 3 == 0) b.write(',');
    b.write(t[i]);
  }
  return b.toString();
}

String timeAgo(String? iso) {
  if (iso == null) return '';
  final d = DateTime.tryParse(iso);
  if (d == null) return '';
  final s = DateTime.now().difference(d).inSeconds;
  if (s < 60) return 'just now';
  if (s < 3600) return '${(s / 60).floor()}m ago';
  if (s < 86400) return '${(s / 3600).floor()}h ago';
  return '${(s / 86400).floor()}d ago';
}

String dateOnly(String? iso) {
  if (iso == null) return '';
  return iso.substring(0, 10);
}