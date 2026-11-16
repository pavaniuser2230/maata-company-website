import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { AdminLayout } from './components/admin/AdminLayout';
import { Layout } from './components/Layout';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { PublicCmsProvider } from './context/PublicCmsContext';
import { isSupportedLanguage } from './i18n';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminArticlesPage } from './pages/admin/AdminArticlesPage';
import { AdminCompanyPage } from './pages/admin/AdminCompanyPage';
import { AdminEnquiriesPage } from './pages/admin/AdminEnquiriesPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminMediaPage } from './pages/admin/AdminMediaPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { LeadershipLayout } from './components/leadership/LeadershipLayout';
import { LeadershipAccessPage } from './pages/leadership/LeadershipAccessPage';
import { LeadershipDocumentsPage } from './pages/leadership/LeadershipDocumentsPage';
import { LeadershipEnquiriesPage } from './pages/leadership/LeadershipEnquiriesPage';
import { LeadershipOverviewPage } from './pages/leadership/LeadershipOverviewPage';
import { LeadershipPublishingPage } from './pages/leadership/LeadershipPublishingPage';
import { LeadershipReportsPage } from './pages/leadership/LeadershipReportsPage';
import { LeadershipSettingsPage } from './pages/leadership/LeadershipSettingsPage';
import { LeadershipTrackerPage } from './pages/leadership/LeadershipTrackerPage';
import { AppEcosystemPage } from './pages/AppEcosystemPage';
import { CareersPage } from './pages/CareersPage';
import { CompanyPage } from './pages/CompanyPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { LegalPage } from './pages/LegalPage';
import { NewsCareersPage } from './pages/NewsCareersPage';
import { TechnologyPage } from './pages/TechnologyPage';

function PublicLayoutRoute() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function LanguagePrefixedRoutes() {
  const { lang } = useParams<{ lang: string }>();
  if (!isSupportedLanguage(lang)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="company" element={<CompanyPage />} />
        <Route path="app" element={<AppEcosystemPage />} />
        <Route path="technology" element={<TechnologyPage />} />
        <Route path="news" element={<NewsCareersPage />} />
        <Route path="careers" element={<CareersPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<LegalPage mode="privacy" />} />
        <Route path="terms" element={<LegalPage mode="terms" />} />
        <Route path="*" element={<Navigate to={`/${lang}`} replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <PublicCmsProvider>
          <AdminAuthProvider>
            <Routes>
              {/* Private Leadership Access & Executive Workspace */}
              <Route path="/leadership/access" element={<LeadershipAccessPage />} />
              <Route path="/leadership" element={<LeadershipLayout />}>
                <Route index element={<LeadershipOverviewPage />} />
                <Route
                  path="product"
                  element={
                    <LeadershipTrackerPage
                      domain="product"
                      title="Product & Development Progress"
                      description="Engineering milestones, MAATA ecosystem architecture, and release readiness."
                      defaultCategory="MAATA App"
                    />
                  }
                />
                <Route
                  path="marketing"
                  element={
                    <LeadershipTrackerPage
                      domain="marketing"
                      title="Marketing & Promotions"
                      description="Regional Chittoor outreach, merchant onboarding drives, and brand campaigns."
                      defaultCategory="Regional Outreach"
                    />
                  }
                />
                <Route
                  path="testing"
                  element={
                    <LeadershipTrackerPage
                      domain="testing"
                      title="App Testing & Feature Updates"
                      description="Working model validation, device QA cycles, and feature verification."
                      defaultCategory="QA & Working Models"
                    />
                  }
                />
                <Route path="reports" element={<LeadershipReportsPage />} />
                <Route path="documents" element={<LeadershipDocumentsPage />} />
                <Route path="publishing" element={<LeadershipPublishingPage />} />
                <Route path="enquiries" element={<LeadershipEnquiriesPage />} />
                <Route path="settings" element={<LeadershipSettingsPage />} />
                <Route path="*" element={<Navigate to="/leadership" replace />} />
              </Route>

              {/* Private Admin Authentication & Protected CMS Workspace */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="company" element={<AdminCompanyPage />} />
                <Route path="articles" element={<AdminArticlesPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />
                <Route path="media" element={<AdminMediaPage />} />
                <Route path="enquiries" element={<AdminEnquiriesPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Public MAATA Technologies Corporate Website */}
              <Route element={<PublicLayoutRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/company" element={<CompanyPage />} />
                <Route path="/app" element={<AppEcosystemPage />} />
                <Route path="/technology" element={<TechnologyPage />} />
                <Route path="/news" element={<NewsCareersPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<LegalPage mode="privacy" />} />
                <Route path="/terms" element={<LegalPage mode="terms" />} />
              </Route>

              {/* Optional Language-Prefixed Public Routes (e.g. /te/company, /hi/app) */}
              <Route path="/:lang/*" element={<LanguagePrefixedRoutes />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AdminAuthProvider>
        </PublicCmsProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
