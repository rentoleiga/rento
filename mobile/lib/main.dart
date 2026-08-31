import 'package:flutter/material.dart';
import 'store.dart';
import 'screens/home_screen.dart';
import 'screens/search_screen.dart';
import 'screens/listing_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/favorites_screen.dart';
import 'screens/messages_screen.dart';
import 'screens/conversation_screen.dart';
import 'screens/profile_screen.dart';

const Color primary = Color(0xFF0E7C66);
const Color ink = Color(0xFF1D2733);
const Color muted = Color(0xFF6B7683);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await auth.init();
  runApp(const RentoApp());
}

class RentoApp extends StatelessWidget {
  const RentoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: auth,
      builder: (context, _) {
        return MaterialApp(
          title: 'Rento',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            useMaterial3: true,
            colorScheme: ColorScheme.fromSeed(seedColor: primary),
            scaffoldBackgroundColor: const Color(0xFFF7F9FB),
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.white,
              elevation: 0,
              centerTitle: false,
            ),
          ),
          initialRoute: '/',
          routes: {
            '/': (_) => const HomeScreen(),
            '/search': (_) => const SearchScreen(),
            '/login': (_) => const AuthScreen(),
            '/dashboard': (_) => const DashboardScreen(),
            '/favorites': (_) => const FavoritesScreen(),
            '/messages': (_) => const MessagesScreen(),
            '/users/:id': (_) => const ProfileScreen(),
          },
          onGenerateRoute: (settings) {
            if (settings.name == '/listing') {
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(builder: (_) => ListingScreen(slug: args['slug']));
            }
            if (settings.name == '/conversation') {
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(builder: (_) => ConversationScreen(conversationId: args['id']));
            }
            if (settings.name == '/profile') {
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(builder: (_) => ProfileScreen(userId: args['id']));
            }
            return null;
          },
        );
      },
    );
  }
}

class Shell extends StatelessWidget {
  const Shell({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Rento'),
          actions: [
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () => Navigator.pushNamed(context, '/search'),
            ),
          ],
        ),
        body: const TabBarView(children: [
          HomeScreen(),
          SearchScreen(),
          FavoritesScreen(),
          MessagesScreen(),
        ]),
        bottomNavigationBar: const TabBar(
          tabs: [
            Tab(icon: Icon(Icons.home), text: 'Home'),
            Tab(icon: Icon(Icons.search), text: 'Search'),
            Tab(icon: Icon(Icons.favorite), text: 'Saved'),
            Tab(icon: Icon(Icons.chat), text: 'Chat'),
          ],
        ),
      ),
    );
  }
}