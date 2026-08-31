import 'package:flutter/material.dart';
import 'main.dart';
import 'api.dart';
import '../store.dart';
import '../widgets.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? stats;
  String? _error;
  int _tab = 0; // 0 renter, 1 owner

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    if (!auth.loggedIn) return;
    setState(() { _error = null; stats = null; });
    try {
      final o = await api.get('/dashboard/overview');
      if (mounted) setState(() => stats = o);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    }
  }

  Future<void> _act(Map<String, dynamic> b, String action) async {
    if (!auth.loggedIn) return;
    try {
      await api.put('/bookings/${b['id']}/status', {'action': action});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Updated: ${b['status']} → $action')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Widget _bookingActions(Map<String, dynamic> b, bool isOwner) {
    final s = '${b['status']}';
    final btn = (String action, String label) => OutlinedButton(
          onPressed: () => _act(b, action),
          style: OutlinedButton.styleFrom(
            foregroundColor: (action == 'reject' || action == 'cancel') ? const Color(0xFFD64545) : primary),
          child: Text(label),
        );
    if (s == 'pending' && isOwner) return Wrap(children: [btn('approve', 'Approve'), btn('reject', 'Reject')]);
    if (s == 'approved' && !isOwner) return Wrap(children: [btn('pay', 'Pay (demo)'), btn('cancel', 'Cancel')]);
    if (s == 'active' && isOwner) return btn('pickup', 'Mark picked up');
    if (s == 'active' && !isOwner) return btn('return', 'Mark returned');
    if (s == 'returned' && isOwner) return btn('complete', 'Complete');
    return const SizedBox.shrink();
  }

  Future<void> _roleGuard() async {
    if (auth.loggedIn) return;
    final ok = await Navigator.pushNamed(context, '/login');
    if (ok == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: ListenableBuilder(
          listenable: auth,
          builder: (context, _) => Text(auth.loggedIn ? 'Hi, ${auth.user?['firstName'] ?? ''}' : 'Dashboard'),
        ),
        actions: [
          IconButton(
            onPressed: auth.loggedIn ? () => auth.logout() : _roleGuard,
            icon: Icon(auth.loggedIn ? Icons.logout : Icons.login),
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: auth,
        builder: (context, _) {
          if (!auth.loggedIn) {
            return Center(
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Text('Log in to see your dashboard', style: TextStyle(color: muted)),
                const SizedBox(height: 10),
                FilledButton(onPressed: _roleGuard, child: const Text('Log in')),
              ]),
            );
          }
          if (_error != null) {
            return ListView(padding: const EdgeInsets.all(16), children: [ErrorBox(message: _error!)]);
          }
          final o = stats?['owner'] as Map<String, dynamic>?;
          final r = stats?['renter'] as Map<String, dynamic>?;
          return RefreshIndicator(
            onRefresh: _load,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(children: [
                  Expanded(child: SegmentedButton<int>(
                    segments: const [
                      ButtonSegment(value: 0, label: Text('Renter')),
                      ButtonSegment(value: 1, label: Text('Owner')),
                    ],
                    selected: {_tab},
                    onSelectionChanged: (s) => setState(() => _tab = s.first),
                  )),
                ]),
                const SizedBox(height: 16),
                if (_tab == 0 && r != null) ..._statCards({
                  'Upcoming': r['upcoming'],
                  'Active': r['active'],
                  'Completed': r['completed'],
                  'Favorites': (stats?['favorites'] as List?)?.length ?? 0,
                }),
                if (_tab == 1 && o != null) ..._statCards({
                  'Active listings': o['listingsActive'],
                  'Pending requests': o['bookingRequests'],
                  'Revenue': formatPrice(o['revenue']),
                  'Completed': o['bookingsCompleted'],
                }),
                const SizedBox(height: 8),
                const Text('My bookings', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                _bookingsList(isOwner: _tab == 1),
              ],
            ),
          );
        },
      ),
    );
  }

  List<Widget> _statCards(Map<String, dynamic> m) => [
        if (m.isNotEmpty)
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.9,
            children: m.entries
                .map((e) => Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                          Text('${e.value}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                          Text('${e.key}', style: const TextStyle(fontSize: 12, color: muted)),
                        ]),
                      ),
                    ))
                .toList(),
          ),
        const SizedBox(height: 16),
      ];

  Widget _bookingsList({required bool isOwner}) {
    return FutureBuilder<dynamic>(
      future: stats == null
          ? null
          : api.get(isOwner ? '/dashboard/owner/bookings' : '/dashboard/renter/bookings'),
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()));
        }
        if (snap.hasError) return ErrorBox(message: '${snap.error}');
        final list = ((snap.data?['bookings'] as List?) ?? []).cast<Map<String, dynamic>>();
        if (list.isEmpty) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: Text('No bookings yet', style: TextStyle(color: muted))),
          );
        }
        return Column(
          children: list.map((b) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('${(b['listing'] as Map<String, dynamic>?)?['title'] ?? ''}',
                            style: const TextStyle(fontWeight: FontWeight.w700)),
                        Text('${dateOnly(b['start'])} → ${dateOnly(b['end'])} · ${formatPrice(b['total'], '${b['currency']}')}',
                            style: const TextStyle(fontSize: 12, color: muted)),
                        Text('Status: ${b['status']}',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: '${b['status']}' == 'completed' ? primary : muted)),
                      ]),
                    ),
                    _bookingActions(b, isOwner),
                  ]),
                ),
              ))
              .toList(),
        );
      },
    );
  }
}