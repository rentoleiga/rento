import 'package:flutter/material.dart';
import 'main.dart';
import 'api.dart';
import '../widgets.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, this.initial});
  final Map<String, dynamic>? initial;
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  List results = [];
  Map<String, dynamic>? data;
  final _kw = TextEditingController();
  String _category = '';
  String _location = '';
  String _sort = 'recommended';
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    final init = widget.initial;
    if (init != null) {
      _kw.text = (init['keyword'] ?? '').toString();
      _category = (init['category'] ?? '').toString();
      _location = (init['location'] ?? '').toString();
      _sort = (init['sort'] ?? 'recommended').toString();
    }
    _run();
  }

  Future<void> _run() async {
    setState(() { _loading = true; _error = null; });
    final params = <String>['facet=0', 'per_page=24'];
    if (_kw.text.trim().isNotEmpty) params.add('keyword=${Uri.encodeQueryComponent(_kw.text.trim())}');
    if (_category.isNotEmpty) params.add('category=$_category');
    if (_location.isNotEmpty) params.add('location=${Uri.encodeQueryComponent(_location)}');
    if (_sort.isNotEmpty) params.add('sort=$_sort');
    try {
      final d = await api.get('/search?${params.join('&')}');
      if (!mounted) return;
      setState(() {
        data = d;
        results = ((d['results'] as List?) ?? []).cast<Map<String, dynamic>>();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _kw.dispose();
    super.dispose();
  }

  void _apply() => _run();

  @override
  Widget build(BuildContext context) {
    final categories = (data?['facets'] as Map?)?.cast<String, dynamic>()?['categories'];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search'),
        actions: [IconButton(onPressed: _run, icon: const Icon(Icons.refresh))],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _kw,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _run(),
                  decoration: InputDecoration(
                    hintText: 'Keyword',
                    isDense: true,
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              DropdownButton<String>(
                value: _sort,
                items: const [
                  DropdownMenuItem(value: 'recommended', child: Text('Recommended')),
                  DropdownMenuItem(value: 'price_asc', child: Text('Price ↑')),
                  DropdownMenuItem(value: 'price_desc', child: Text('Price ↓')),
                  DropdownMenuItem(value: 'rating', child: Text('Top rated')),
                  DropdownMenuItem(value: 'newest', child: Text('Newest')),
                ],
                onChanged: (v) { setState(() => _sort = v!); _run(); },
              ),
            ]),
          ),
          if (_location.isNotEmpty || _category.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(children: [
                if (_category.isNotEmpty) Chip(label: Text('$_category'), onDeleted: () => setState(() { _category = ''; })),
                if (_location.isNotEmpty) Chip(label: Text('$_location'), onDeleted: () => setState(() { _location = ''; })),
                TextButton(onPressed: () { setState(() { _category = ''; _location = ''; }); _run(); }, child: const Text('Reset')),
              ]),
            ),
          Expanded(child: _body()),
        ],
      ),
    );
  }

  Widget _body() {
    if (_error != null) return Center(child: Padding(padding: EdgeInsets.all(20), child: ErrorBox(message: _error!)));
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (results.isEmpty) {
      return Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.search_off, size: 48, color: Colors.grey),
          const SizedBox(height: 10),
          const Text('No listings found', style: TextStyle(color: muted)),
          TextButton(onPressed: _run, child: const Text('Try again')),
        ]),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: results.length,
      itemBuilder: (_, i) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: ListingCard(listing: results[i] as Map<String, dynamic>),
      ),
    );
  }
}