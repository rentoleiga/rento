import 'package:flutter/material.dart';
import 'main.dart';
import 'api.dart';
import '../store.dart';
import '../widgets.dart';

class ProfileScreen extends StatefulWidget {
  final int? userId;
  const ProfileScreen({super.key, this.userId});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  List<Map<String, dynamic>> _listings = [];
  int? _uid;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    _uid = widget.userId ?? (auth.user?['id'] as num?)?.toInt();
    if (_uid == null) return;
    try {
      final d = await api.get('/users/$_uid');
      if (mounted) {
        setState(() {
          _user = d['user'] as Map<String, dynamic>?;
          _listings = ((d['listings'] as List?) ?? []).cast<Map<String, dynamic>>();
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = _user;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: u == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: const Color(0xFFEEF1F4),
                    child: Text('${(u['firstName'] ?? 'U').toString()[0]}',
                        style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('${u['fullName'] ?? ''}', style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
                      Text('${u['city'] ?? ''}', style: const TextStyle(color: muted)),
                      Row(children: [
                        stars(ratingOf(u)),
                        const SizedBox(width: 6),
                        Text('${ratingOf(u).toStringAsFixed(1)} (${u['reviewCount'] ?? 0})',
                            style: const TextStyle(fontSize: 13, color: muted)),
                      ]),
                      if (u['identityVerified'] == true)
                        const Text('Identity verified', style: TextStyle(fontSize: 12, color: primary)),
                    ]),
                  ),
                ]),
                const SizedBox(height: 16),
                if ((u['bio'] as String? ?? '').isNotEmpty) ...[
                  const Text('About', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text('${u['bio']}', style: const TextStyle(color: ink)),
                  const SizedBox(height: 12),
                ],
                if (_listings.isNotEmpty) ...[
                  const Text('Listings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  ..._listings.map((l) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: ListingCard(listing: l),
                      )),
                ],
              ],
            ),
    );
  }
}