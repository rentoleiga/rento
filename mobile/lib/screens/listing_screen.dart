import 'package:flutter/material.dart';
import 'api.dart';
import '../store.dart';
import '../widgets.dart';

class ListingScreen extends StatefulWidget {
  final String slug;
  const ListingScreen({super.key, required this.slug});
  @override
  State<ListingScreen> createState() => _ListingScreenState();
}

class _ListingScreenState extends State<ListingScreen> {
  Map<String, dynamic>? listing;
  List<Map<String, dynamic>> reviews = [];
  String? _error;
  bool _busy = false;
  bool _fav = false;
  DateTimeRange? range;
  Map<String, dynamic>? quote;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _error = null; listing = null; });
    try {
      final d = await api.get('/listings/${widget.slug}?inc=1');
      final l = d['listing'] as Map<String, dynamic>;
      final r = await api.get('/reviews/listing/${l['id']}');
      if (!mounted) return;
      setState(() {
        listing = l;
        _fav = l['isFavorite'] == true;
        reviews = ((r['reviews'] as List?) ?? []).cast<Map<String, dynamic>>();
      });
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    }
  }

  Future<bool> _ensureLogin() async {
    if (auth.loggedIn) return true;
    final ok = await Navigator.pushNamed(context, '/login');
    return ok == true;
  }

  Future<void> _toggleFav() async {
    if (!await _ensureLogin()) return;
    final l = listing!;
    try {
      if (_fav) {
        await api.delete('/listings/${l['id']}/favorite');
        setState(() => _fav = false);
      } else {
        await api.post('/listings/${l['id']}/favorite');
        setState(() => _fav = true);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _pickRange() async {
    final r = await showDateRangePicker(
      context: context, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (r == null || listing == null) return;
    setState(() {
      range = r;
      quote = null;
    });
    try {
      final q = await api.post('/bookings/listings/${listing!['id']}/quote', {
        'start': r.start.toUtc().toIso8601String(),
        'end': r.end.add(const Duration(days: 1)).toUtc().toIso8601String(),
      });
      if (mounted) setState(() => quote = q);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _book() async {
    if (!await _ensureLogin()) return;
    if (range == null || listing == null) return;
    setState(() => _busy = true);
    try {
      await api.post('/bookings', {
        'listingId': listing!['id'],
        'start': range!.start.toUtc().toIso8601String(),
        'end': range!.end.add(const Duration(days: 1)).toUtc().toIso8601String(),
        'message': 'Hello! I would like to book ${listing!['title']}.',
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking request sent')));
      Navigator.pushNamed(context, '/dashboard');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _messageOwner() async {
    if (!await _ensureLogin()) return;
    if (listing == null) return;
    final controller = TextEditingController();
    final msg = await showDialog<String>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Message owner'),
        content: TextField(controller: controller, maxLines: 4,
            decoration: const InputDecoration(hintText: 'Hi, I have a question about…')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(c, controller.text), child: const Text('Send')),
        ],
      ),
    );
    if (msg == null || msg.trim().isEmpty) return;
    try {
      final ownerId = (listing!['owner'] as Map<String, dynamic>?)?['id'];
      await api.post('/conversations', {
        'listingId': listing!['id'], 'recipientId': ownerId, 'message': msg,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Message sent')));
        Navigator.pushNamed(context, '/messages');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Listing'), actions: [
        ListenableBuilder(
          listenable: auth,
          builder: (context, _) => IconButton(
            onPressed: _toggleFav,
            icon: Icon(_fav ? Icons.favorite : Icons.favorite_border,
                color: _fav ? const Color(0xFFD64545) : muted),
          ),
        ),
      ]),
      body: _body(context),
    );
  }

  Widget _body(BuildContext context) {
    if (_error != null) {
      return ListView(padding: const EdgeInsets.all(16), children: [ErrorBox(message: _error!)]);
    }
    final l = listing;
    if (l == null) return const Center(child: CircularProgressIndicator());

    final gallery = ((l['gallery'] as List?)?.isEmpty ?? true)
        ? [l['mainImage'] ?? '']
        : (l['gallery'] as List).cast<String>();
    final owner = (l['owner'] as Map<String, dynamic>?) ?? {};
    final attrs = (l['attributes'] as Map<String, dynamic>?) ?? {};
    final daily = l['priceDaily'];
    final hourly = l['priceHourly'];
    final currency = '${l['currency']}';
    final priceLine = daily is num
        ? '${formatPrice(daily, currency)} / day'
        : (hourly is num ? '${formatPrice(hourly, currency)} / hour' : 'Price on request');
    final total = (quote?['total'] as num?)?.toDouble() ?? 0;
    final deposit = (l['depositAmount'] as num?)?.toDouble() ?? 0;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: AspectRatio(
              aspectRatio: 16 / 10,
              child: (gallery.first as String).isNotEmpty
                  ? Image.network(gallery.first, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _ph())
                  : _ph(),
            ),
          ),
          const SizedBox(height: 12),
          Text('${l['title']}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          Text('${l['subtitle'] ?? ''}', style: const TextStyle(color: muted)),
          const SizedBox(height: 4),
          Row(children: [
            stars(ratingOf(l)),
            const SizedBox(width: 6),
            Text('${ratingOf(l).toStringAsFixed(1)} (${l['reviewCount'] ?? 0})', style: const TextStyle(fontSize: 13, color: muted)),
          ]),
          Text('📍 ${l['city'] ?? ''}', style: const TextStyle(fontSize: 13, color: muted)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(priceLine, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text('Deposit ${formatPrice(deposit, currency)} · min ${l['minimumDuration']} ${l['minimumDurationUnit']}',
                    style: const TextStyle(fontSize: 13, color: muted)),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _pickRange,
                    child: Text(range == null
                        ? 'Check availability'
                        : '${dateOnly(range!.start.toIso8601String())} → ${dateOnly(range!.end.toIso8601String())} (change)'),
                  ),
                ),
                if (quote != null) ...[
                  const SizedBox(height: 10),
                  _costRow('Base', formatPrice(quote!['base'], currency)),
                  if ((quote!['cleaningFee'] ?? 0) > 0) _costRow('Cleaning fee', formatPrice(quote!['cleaningFee'], currency)),
                  if ((quote!['deliveryFee'] ?? 0) > 0) _costRow('Delivery fee', formatPrice(quote!['deliveryFee'], currency)),
                  if ((quote!['pickupFee'] ?? 0) > 0) _costRow('Pickup fee', formatPrice(quote!['pickupFee'], currency)),
                  const Divider(height: 12),
                  _costRow('Total', formatPrice(total, currency), bold: true),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _busy ? null : _book,
                      child: Text(_busy ? 'Sending…' : ((l['instantBooking'] == true) ? 'Book now' : 'Request booking')),
                    ),
                  ),
                ],
              ]),
            ),
          ),
          const SizedBox(height: 12),
          _section('Description', Text('${l['description']}')),
          if (attrs.isNotEmpty) _section('Specifications', _specGrid(attrs)),
          _section('Rules', _specGrid({
            'Smoking allowed': l['smokingAllowed'] == true ? 'Yes' : 'No',
            'Pets allowed': l['petsAllowed'] == true ? 'Yes' : 'No',
            'Cancellation': '${l['cancellationPolicy']}',
            'Condition': '${l['condition']}',
          })),
          if (owner.isNotEmpty)
            _section('Owner', ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('${owner['firstName']} ${owner['lastName']}',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('Rating ${ratingOf(owner).toStringAsFixed(1)}', style: const TextStyle(color: muted)),
              trailing: OutlinedButton(onPressed: _messageOwner, child: const Text('Message')),
            )),
          if (reviews.isNotEmpty) ...[
            const SizedBox(height: 8),
            const Text('Reviews', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            ...reviews.map((r) => Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        stars(ratingOf(r)),
                        const SizedBox(width: 6),
                        Text('${(r['reviewer'] as Map<String, dynamic>?)?['name']}',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      ]),
                      const SizedBox(height: 4),
                      Text('${r['comment'] ?? ''}', style: const TextStyle(fontSize: 14)),
                    ]),
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _ph() => Container(
        color: const Color(0xFFEEF1F4),
        alignment: Alignment.center,
        child: const Text('Rento', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.grey)),
      );

  Widget _costRow(String label, String value, {bool bold = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: TextStyle(color: muted, fontSize: 14, fontWeight: bold ? FontWeight.w800 : FontWeight.w400)),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
        ]),
      );

  Widget _section(String title, Widget child) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            child,
          ]),
        ),
      );

  Widget _specGrid(Map<String, dynamic> map) => Wrap(
        spacing: 24,
        runSpacing: 8,
        children: map.entries
            .map((e) => Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                  Text('${e.key}', style: const TextStyle(fontSize: 12, color: muted)),
                  Text('${e.value}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                ]))
            .toList(),
      );
}