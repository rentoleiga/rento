import 'package:flutter/material.dart';
import 'main.dart';
import '../store.dart';
import '../widgets.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _login = true;
  final _email = TextEditingController(text: 'demo.renter@rento.is');
  final _password = TextEditingController(text: 'password123');
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _city = TextEditingController(text: 'Reykjavík');
  bool _owner = true;
  bool _renter = true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose(); _password.dispose(); _first.dispose(); _last.dispose(); _city.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() { _busy = true; _error = null; });
    try {
      if (_login) {
        await auth.login(_email.text.trim(), _password.text);
      } else {
        await auth.register({
          'email': _email.text.trim(),
          'password': _password.text,
          'firstName': _first.text.trim(),
          'lastName': _last.text.trim(),
          'city': _city.text.trim(),
          'ownerEnabled': _owner,
          'renterEnabled': _renter,
        });
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_login ? 'Log in' : 'Create account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(_login ? 'Welcome back' : 'One account for renting and listing.',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          if (_error != null) ...[ErrorBox(message: _error!), const SizedBox(height: 8)],
          if (!_login) ...[
            Row(children: [
              Expanded(child: TextField(controller: _first, decoration: const InputDecoration(labelText: 'First name'))),
              const SizedBox(width: 10),
              Expanded(child: TextField(controller: _last, decoration: const InputDecoration(labelText: 'Last name'))),
            ]),
            const SizedBox(height: 12),
          ],
          TextField(controller: _email, keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.mail_outline))),
          const SizedBox(height: 12),
          TextField(controller: _password, obscureText: true,
              decoration: const InputDecoration(labelText: 'Password (min 8 chars)', prefixIcon: Icon(Icons.lock_outline))),
          if (!_login) ...[
            const SizedBox(height: 12),
            TextField(controller: _city, decoration: const InputDecoration(labelText: 'City')),
            const SizedBox(height: 8),
            CheckboxListTile(contentPadding: EdgeInsets.zero, value: _renter,
                onChanged: (v) => setState(() => _renter = v ?? false), title: const Text('I want to rent things')),
            CheckboxListTile(contentPadding: EdgeInsets.zero, value: _owner,
                onChanged: (v) => setState(() => _owner = v ?? false), title: const Text('I want to list my items')),
          ],
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _busy ? null : _submit,
            style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
            child: Text(_busy ? 'Please wait…' : (_login ? 'Log in' : 'Create account')),
          ),
          TextButton(
            onPressed: () => setState(() { _login = !_login; _error = null; }),
            child: Text(_login ? 'No account? Register' : 'Already registered? Log in'),
          ),
        ]),
      ),
    );
  }
}