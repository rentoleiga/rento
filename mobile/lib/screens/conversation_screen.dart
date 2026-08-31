import 'package:flutter/material.dart';
import 'main.dart';
import 'api.dart';
import '../store.dart';

class ConversationScreen extends StatefulWidget {
  final int conversationId;
  const ConversationScreen({super.key, required this.conversationId});
  @override
  State<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends State<ConversationScreen> {
  List<Map<String, dynamic>> _msgs = [];
  Map<String, dynamic>? _conv;
  final _input = TextEditingController();
  bool _busy = false;
  bool _loaded = false;

  int get _meId => (auth.user?['id'] as num?)?.toInt() ?? -1;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    try {
      final d = await api.get('/conversations/${widget.conversationId}/messages');
      if (mounted) setState(() {
        _conv = d['conversation'] as Map<String, dynamic>?;
        _msgs = ((d['messages'] as List?) ?? []).cast<Map<String, dynamic>>();
        _loaded = true;
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _busy) return;
    setState(() => _busy = true);
    try {
      final d = await api.post('/conversations/${widget.conversationId}/messages', {'message': text});
      if (mounted) {
        setState(() {
          _msgs.add((d['message'] as Map<String, dynamic>?) ?? {});
          _input.clear();
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = _conv;
    final title = c == null ? 'Conversation' : (
        _meId == c['renter_id'] ? '${c['owner_first']} ${c['owner_last']}' : '${c['renter_first']} ${c['renter_last']}');
    return Scaffold(
      appBar: AppBar(title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontSize: 16)),
        if (c != null)
          Text('about ${c['listing_title']}',
              style: const TextStyle(fontSize: 11, color: muted, fontWeight: FontWeight.w400)),
      ])),
      body: !_loaded
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _msgs.length,
                  itemBuilder: (_, i) {
                    final m = _msgs[i];
                    final me = (m['sender_id'] as num?)?.toInt() == _meId;
                    return Align(
                      alignment: me ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
                        decoration: BoxDecoration(
                          color: me ? primary : const Color(0xFFEEF1F4),
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(12),
                            topRight: const Radius.circular(12),
                            bottomLeft: Radius.circular(me ? 12 : 4),
                            bottomRight: Radius.circular(me ? 4 : 12),
                          ),
                        ),
                        child: Column(crossAxisAlignment: me ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
                          Text('${m['message'] ?? ''}',
                              style: TextStyle(color: me ? Colors.white : ink, fontSize: 14)),
                          Text(timeAgo('${m['created_at']}'),
                              style: TextStyle(fontSize: 11, color: me ? Colors.white70 : muted)),
                        ]),
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(children: [
                  Expanded(
                    child: TextField(
                      controller: _input,
                      decoration: InputDecoration(
                        hintText: 'Write a message…',
                        isDense: true,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: _busy ? null : _send,
                    child: _busy ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Send'),
                  ),
                ]),
              ),
            ]),
    );
  }
}