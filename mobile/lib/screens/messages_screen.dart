import 'package:flutter/material.dart';
import 'main.dart';
import 'api.dart';
import '../store.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});
  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Map<String, dynamic>> _convs = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final d = await api.get('/conversations');
      if (mounted) setState(() => _convs = ((d['conversations'] as List?) ?? []).cast<Map<String, dynamic>>());
    } catch (_) {
      if (mounted) setState(() => _convs = []);
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
      appBar: AppBar(title: const Text('Messages'), actions: [
        IconButton(onPressed: _guard, icon: const Icon(Icons.refresh)),
      ]),
      body: ListenableBuilder(
        listenable: auth,
        builder: (context, _) {
          if (!auth.loggedIn) {
            return Center(
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Text('Log in to see your messages', style: TextStyle(color: muted)),
                const SizedBox(height: 10),
                FilledButton(onPressed: _guard, child: const Text('Log in')),
              ]),
            );
          }
          if (_loading) return const Center(child: CircularProgressIndicator());
          if (_convs.isEmpty) {
            return const Center(child: Text('No conversations yet', style: TextStyle(color: muted)));
          }
          return RefreshIndicator(
            onRefresh: _load,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _convs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final c = _convs[i];
                final unread = c['unread'] ?? 0;
                final others = (auth.user?['id'] == c['renter_id'])
                    ? '${c['owner_first']} ${c['owner_last']}'
                    : '${c['renter_first']} ${c['renter_last']}';
                return Card(
                  child: ListTile(
                    leading: (c['listing_image'] as String? ?? '').isNotEmpty
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: SizedBox(width: 56, height: 42,
                                child: Image.network('${c['listing_image']}', fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(color: const Color(0xFFEEF1F4)))),
                          )
                        : const SizedBox(width: 56),
                    title: Row(children: [
                      Expanded(child: Text('${c['listing_title']}', style: const TextStyle(fontWeight: FontWeight.w700))),
                      if (unread is int && unread > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(999)),
                          child: Text('$unread', style: const TextStyle(color: Colors.white, fontSize: 12)),
                        ),
                    ]),
                    subtitle: Text('$others · ${timeAgo('${c['updated_at']}')}', style: const TextStyle(color: muted, fontSize: 13)),
                    onTap: () => Navigator.pushNamed(context, '/conversation', arguments: {'id': c['id']}),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}