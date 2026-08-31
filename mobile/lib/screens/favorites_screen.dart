import 'package:flutter/material.dart';
import 'main.dart';
import 'api.dart';
import '../store.dart';
import '../widgets.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});
  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final d = await api.get('/favorites');
      if (mounted) setState(() => _rows = ((d['favorites'] as List?) ?? []).cast<Map<String, dynamic>>());
    } catch (_) {
      if (mounted) setState(() => _rows = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _guard() async {
    if (auth.loggedIn) return;
    final ok = await Navigator.pushNamed(context, '/login');
    if (ok == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Favorites'), actions: [
        IconButton(onPressed: _guard, icon: const Icon(Icons.refresh)),
      ]),
      body: ListenableBuilder(
        listenable: auth,
        builder: (context, _) {
          if (!auth.loggedIn) {
            return Center(
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Text('Log in to see your favorites', style: TextStyle(color: muted)),
                const SizedBox(height: 10),
                FilledButton(onPressed: _guard, child: const Text('Log in')),
              ]),
            );
          }
          if (_loading) return const Center(child: CircularProgressIndicator());
          if (_rows.isEmpty) {
            return const Center(child: Text('No favorites yet', style: TextStyle(color: muted)));
          }
          return RefreshIndicator(
            onRefresh: _load,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _rows.length,
              itemBuilder: (_, i) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: ListingCard(listing: _rows[i]),
              ),
            ),
          );
        },
      ),
    );
  }
}