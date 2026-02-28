'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { FullPageLoader } from '@/components/ui/Loading';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on role
      if (user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else if (user.role === 'EMPLOYER') {
        router.push('/employer/dashboard');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <FullPageLoader />;
  }

  // If user is logged in, they'll be redirected, so show loader
  if (user) {
    return <FullPageLoader />;
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/logo-sip.png" alt="SIP Logo" className="h-12 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/auth/login" 
                className="px-6 py-2.5 text-[var(--primary)] font-semibold hover:bg-[var(--background)] transition uppercase tracking-wide text-sm"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/register" 
                className="px-6 py-2.5 bg-[var(--accent)] text-[var(--primary-dark)] font-semibold hover:bg-[var(--accent-hover)] transition uppercase tracking-wide text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 hero-pattern">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/20 border border-[var(--accent)] text-[var(--primary)] font-semibold text-sm uppercase tracking-wider mb-6">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Trusted Platform
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-[var(--primary)] leading-tight mb-6">
                Launch Your Career with 
                <span className="text-[var(--accent)]"> Verified</span> Internships
              </h1>
              <p className="text-xl text-[var(--text-secondary)] mb-8 leading-relaxed">
                Connect with top companies offering secure, escrow-protected internships. 
                Our KYC-verified platform ensures safe opportunities for students and quality talent for employers.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/auth/register" 
                  className="px-8 py-4 bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-light)] transition uppercase tracking-wide"
                >
                  Find Internships
                </Link>
                <Link 
                  href="/auth/register?role=employer" 
                  className="px-8 py-4 border-2 border-[var(--primary)] text-[var(--primary)] font-semibold hover:bg-[var(--primary)] hover:text-white transition uppercase tracking-wide"
                >
                  Post Internships
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-10 pt-8 border-t border-[var(--border)]">
                <div>
                  <div className="text-3xl font-bold text-[var(--primary)]">10K+</div>
                  <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Active Students</div>
                </div>
                <div className="w-px h-12 bg-[var(--border)]"></div>
                <div>
                  <div className="text-3xl font-bold text-[var(--primary)]">500+</div>
                  <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Companies</div>
                </div>
                <div className="w-px h-12 bg-[var(--border)]"></div>
                <div>
                  <div className="text-3xl font-bold text-[var(--primary)]">2K+</div>
                  <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Internships</div>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -top-8 -left-8 w-72 h-72 bg-[var(--accent)]/20"></div>
              <div className="absolute -bottom-8 -right-8 w-72 h-72 bg-[var(--primary)]/10"></div>
              <div className="relative">
                <img 
                  src="/hero-illustration.svg" 
                  alt="SIP Platform - Dashboard Preview" 
                  className="w-full h-auto drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--primary)] mb-4">Why Choose SIP?</h2>
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
              A secure platform built to protect both students and employers with verified profiles and escrow-protected payments.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 border-2 border-[var(--border)] hover:border-[var(--accent)] transition group">
              <div className="w-14 h-14 bg-[var(--primary)] flex items-center justify-center text-white mb-6 group-hover:bg-[var(--accent)] transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--primary)] mb-3">KYC Verified Profiles</h3>
              <p className="text-[var(--text-secondary)]">
                All users undergo strict identity verification to ensure authenticity and build trust in the platform.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-8 border-2 border-[var(--border)] hover:border-[var(--accent)] transition group">
              <div className="w-14 h-14 bg-[var(--primary)] flex items-center justify-center text-white mb-6 group-hover:bg-[var(--accent)] transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--primary)] mb-3">Escrow Protected Payments</h3>
              <p className="text-[var(--text-secondary)]">
                Stipends are held securely and released only upon successful completion of milestones.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-8 border-2 border-[var(--border)] hover:border-[var(--accent)] transition group">
              <div className="w-14 h-14 bg-[var(--primary)] flex items-center justify-center text-white mb-6 group-hover:bg-[var(--accent)] transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--primary)] mb-3">Quality Matching</h3>
              <p className="text-[var(--text-secondary)]">
                AI-powered matching connects the right students with the right opportunities based on skills and preferences.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="p-8 border-2 border-[var(--border)] hover:border-[var(--accent)] transition group">
              <div className="w-14 h-14 bg-[var(--primary)] flex items-center justify-center text-white mb-6 group-hover:bg-[var(--accent)] transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--primary)] mb-3">Real-time Messaging</h3>
              <p className="text-[var(--text-secondary)]">
                Communicate seamlessly with employers through our integrated messaging system.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="p-8 border-2 border-[var(--border)] hover:border-[var(--accent)] transition group">
              <div className="w-14 h-14 bg-[var(--primary)] flex items-center justify-center text-white mb-6 group-hover:bg-[var(--accent)] transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--primary)] mb-3">Analytics Dashboard</h3>
              <p className="text-[var(--text-secondary)]">
                Track your applications, view insights, and optimize your job search with detailed analytics.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="p-8 border-2 border-[var(--border)] hover:border-[var(--accent)] transition group">
              <div className="w-14 h-14 bg-[var(--primary)] flex items-center justify-center text-white mb-6 group-hover:bg-[var(--accent)] transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--primary)] mb-3">Smart Application Tracking</h3>
              <p className="text-[var(--text-secondary)]">
                Kanban-style boards help you manage applications through every stage of the hiring process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--primary)] mb-4">How It Works</h2>
            <p className="text-xl text-[var(--text-secondary)]">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[var(--primary)] flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-[var(--primary)] mb-3">Create Your Profile</h3>
              <p className="text-[var(--text-secondary)]">
                Sign up, complete your profile, and upload your resume. Verify your identity through our KYC process.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[var(--accent)] flex items-center justify-center text-[var(--primary-dark)] text-3xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-[var(--primary)] mb-3">Apply to Internships</h3>
              <p className="text-[var(--text-secondary)]">
                Browse verified opportunities, filter by your preferences, and apply with a single click.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[var(--primary)] flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-[var(--primary)] mb-3">Start Your Career</h3>
              <p className="text-[var(--text-secondary)]">
                Get hired, receive escrow-protected payments, and build valuable experience with top companies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--primary)]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join thousands of students who have launched their careers through verified internships.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/auth/register" 
              className="px-10 py-4 bg-[var(--accent)] text-[var(--primary-dark)] font-bold hover:bg-[var(--accent-hover)] transition uppercase tracking-wide"
            >
              Get Started Free
            </Link>
            <Link 
              href="/auth/login" 
              className="px-10 py-4 border-2 border-white text-white font-bold hover:bg-white hover:text-[var(--primary)] transition uppercase tracking-wide"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[var(--primary-dark)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/logo-sip.png" alt="SIP Logo" className="h-16 w-auto" />
              </div>
              <p className="text-white/60 text-sm">
                Connecting verified students with trusted employers for secure internship opportunities.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wide text-sm">For Students</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/auth/register" className="hover:text-[var(--accent)] transition">Browse Internships</Link></li>
                <li><Link href="/auth/register" className="hover:text-[var(--accent)] transition">How It Works</Link></li>
                <li><Link href="/auth/register" className="hover:text-[var(--accent)] transition">Success Stories</Link></li>
                <li><Link href="/auth/register" className="hover:text-[var(--accent)] transition">Resources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wide text-sm">For Employers</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/auth/register?role=employer" className="hover:text-[var(--accent)] transition">Post Internships</Link></li>
                <li><Link href="/auth/register?role=employer" className="hover:text-[var(--accent)] transition">Find Talent</Link></li>
                <li><Link href="/auth/register?role=employer" className="hover:text-[var(--accent)] transition">Pricing</Link></li>
                <li><Link href="/auth/register?role=employer" className="hover:text-[var(--accent)] transition">Enterprise</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wide text-sm">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/auth/login" className="hover:text-[var(--accent)] transition">About Us</Link></li>
                <li><Link href="/auth/login" className="hover:text-[var(--accent)] transition">Contact</Link></li>
                <li><Link href="/auth/login" className="hover:text-[var(--accent)] transition">Privacy Policy</Link></li>
                <li><Link href="/auth/login" className="hover:text-[var(--accent)] transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/60 text-sm">
            <p>© 2026 Smart Internship Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
