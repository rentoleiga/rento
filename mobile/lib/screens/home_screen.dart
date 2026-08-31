import 'package:flutter/material.dart';
import 'main.dart';
import 'api.dart';
import '../widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List categories = [];
  List featured = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final c = await api.get('/categories');
      final f = await api.get('/search?facet=0&per_page=8&sort=recommended');
      if (!mounted) return;
      setState(() {
        categories = (c['categories'] as List?) ?? [];
        featured = ((f['results'] as List?) ?? []).cast<Map<String, dynamic>>();
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(children: [
          Icon(Icons.landscape, color: primary),
          SizedBox(width: 8),
          Text('Rento', style: TextStyle(fontWeight: FontWeight.w800)),
        ]),
        actions: [
          IconButton(
            onPressed: () => Navigator.pushNamed(context, '/dashboard'),
            icon: const Icon(Icons.person_outline),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              color: primary,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Rent anything in Iceland',
                      style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text('Campervans, bikes, gear and more',
                      style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 15)),
                  const SizedBox(height: 16),
                  TextField(
                    onSubmitted: (q) => Navigator.pushNamed(context, '/search', arguments: {'keyword': q}),
                    decoration: InputDecoration(
                      hintText: 'What do you want to rent?',
                      filled: true,
                      fillColor: Colors.white,
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Categories', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  TextButton(onPressed: () => Navigator.pushNamed(context, '/search'), child: const Text('Browse all')),
                ],
              ),
            ),
            SizedBox(
              height: 84,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (_, i) {
                  final c = categories[i] as Map<String, dynamic>;
                  return GestureDetector(
                    onTap: () => Navigator.pushNamed(context, '/search', arguments: {'category': c['slug']}),
                    child: Container(
                      width: 96,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE4E8EE)),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('${c['icon'] ?? '📦'}', style: const TextStyle(fontSize: 22)),
                          const SizedBox(height: 4),
                          Text('${c['name']}',
                              maxLines: 1, overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 20, 16, 8),
              child: Text('Featured listings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            ),
            if (featured.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: Text('Loading…', style: TextStyle(color: muted))),
              )
            else
              GridView.builder(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.78,
                ),
                itemCount: featured.length,
                itemBuilder: (_, i) => ListingCard(listing: featured[i] as Map<String, dynamic>),
              ),
          ],
        ),
      ),
    );
  }
}