import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import RequireAuth from "./components/RequireAuth";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ListingPage from "./pages/ListingPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
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
import CreditsPage from "./pages/CreditsPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import CalculatorPage from "./pages/CalculatorPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import CookiesPage from "./pages/CookiesPage";
import BannedPage from "./pages/BannedPage";
import SafetyPage from "./pages/SafetyPage";
import FaqPage from "./pages/FaqPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import MyPaymentsPage from "./pages/MyPaymentsPage";
import AdminPage from "./pages/AdminPage";
import { useAuth } from "./store";
import { trackVisit, startTracking } from "./lib/track";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function VisitTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    startTracking();
  }, []);
  useEffect(() => {
    trackVisit(pathname);
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
      <VisitTracker />
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/listing/:slug" element={<ListingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/dashboard/listings" element={<RequireAuth><MyListingsPage /></RequireAuth>} />
          <Route path="/dashboard/listings/:id" element={<RequireAuth><ListingFormPage /></RequireAuth>} />
          <Route path="/dashboard/listings/new" element={<RequireAuth><ListingFormPage /></RequireAuth>} />
          <Route path="/dashboard/calendar/:listingId" element={<RequireAuth><CalendarPage /></RequireAuth>} />
          <Route path="/dashboard/bookings" element={<RequireAuth><MyBookingsPage /></RequireAuth>} />
          <Route path="/dashboard/payments" element={<RequireAuth><MyPaymentsPage /></RequireAuth>} />
          <Route path="/dashboard/credits" element={<CreditsPage />} />
          <Route path="/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
          <Route path="/messages/:conversationId" element={<RequireAuth><ConversationPage /></RequireAuth>} />
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
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <CookieConsent />
    </>
  );
}