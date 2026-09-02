import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ListingPage from "./pages/ListingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import MyListingsPage from "./pages/MyListingsPage";
import ListingFormPage from "./pages/ListingFormPage";
import CalendarPage from "./pages/CalendarPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import FavoritesPage from "./pages/FavoritesPage";
import MessagesPage from "./pages/MessagesPage";
import ConversationPage from "./pages/ConversationPage";
import ProfilePage from "./pages/ProfilePage";
import PremiumPage from "./pages/PremiumPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import CalculatorPage from "./pages/CalculatorPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import CookiesPage from "./pages/CookiesPage";
import BannedPage from "./pages/BannedPage";
import SafetyPage from "./pages/SafetyPage";
import FaqPage from "./pages/FaqPage";
import { useAuth } from "./store";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { refresh } = useAuth();
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/listing/:slug" element={<ListingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/listings" element={<MyListingsPage />} />
          <Route path="/dashboard/listings/:id" element={<ListingFormPage />} />
          <Route path="/dashboard/listings/new" element={<ListingFormPage />} />
          <Route path="/dashboard/calendar/:listingId" element={<CalendarPage />} />
          <Route path="/dashboard/bookings" element={<MyBookingsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<ConversationPage />} />
          <Route path="/users/:id" element={<ProfilePage />} />
          <Route path="/promote" element={<PremiumPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/banned" element={<BannedPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/faq" element={<FaqPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}