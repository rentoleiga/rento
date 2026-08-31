import 'package:flutter/material.dart';
import 'main.dart';
import 'api.dart';
import 'store.dart';

class ListingCard extends StatelessWidget {
  final Map<String, dynamic> listing;
  const ListingCard({super.key, required this.listing});

  String get image => (listing['mainImage'] ?? '').toString();

  @override
  Widget build(BuildContext context) {
    final daily = listing['priceDaily'];
    final hourly = listing['priceHourly'];
    String priceLine = 'Price on request';
    if (daily is num) {
      priceLine = '${formatPrice(daily, '${listing['currency']}')} / day';
    } else if (hourly is num) {
      priceLine = '${formatPrice(hourly, '${listing['currency']}')} / hour';
    }
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, '/listing', arguments: {'slug': listing['slug']}),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 3 / 2,
              child: image.isNotEmpty
                  ? Image.network(image, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _ph())
                  : _ph(),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${listing['title']}', maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                  const SizedBox(height: 4),
                  Row(children: [
                    stars(ratingOf(listing), size: 14),
                    const SizedBox(width: 4),
                    Text('${ratingOf(listing).toStringAsFixed(1)} (${listing['reviewCount'] ?? 0})',
                        style: const TextStyle(fontSize: 12, color: muted)),
                  ]),
                  const SizedBox(height: 2),
                  Text('${listing['city'] ?? ''}', style: const TextStyle(fontSize: 12, color: muted)),
                  const SizedBox(height: 6),
                  Text(priceLine, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _ph() => Container(
        color: const Color(0xFFEEF1F4),
        alignment: Alignment.center,
        child: const Text('Rento', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.grey)),
      );
}

class ErrorBox extends StatelessWidget {
  final String message;
  const ErrorBox({super.key, required this.message});
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: const Color(0xFFFDEcea), borderRadius: BorderRadius.circular(8)),
        child: Text(message, style: const TextStyle(color: Color(0xFFA83737), fontSize: 13)),
      );
}

Future<Map<String, dynamic>?> requireLogin(BuildContext context, AuthState auth) async {
  if (auth.loggedIn) return auth.user;
  final ok = await Navigator.pushNamed(context, '/login');
  if (ok == true) return auth.user;
  return null;
}