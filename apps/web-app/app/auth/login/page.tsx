'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { FullPageLoader } from '@/components/ui/Loading';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (user && !authLoading) {
      router.push(redirect || '/');
    }
  }, [user, authLoading, redirect, router]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
    } catch (error: any) {
      setGeneralError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--primary)] flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <img src="/logo-sip.png" alt="SIP Logo" className="w-56 h-auto mx-auto mb-8 drop-shadow-lg" />
          <p className="text-white/80 text-lg mb-8">
            Connect with verified employers and kickstart your career with secure, escrow-protected internships.
          </p>
          <div className="flex justify-center gap-8 text-white/60 text-sm">
            <div>
              <div className="text-3xl font-bold text-white mb-1">10K+</div>
              <div>Students</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">500+</div>
              <div>Companies</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">2K+</div>
              <div>Internships</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo-sip.png" alt="SIP Logo" className="w-40 h-auto mx-auto mb-4" />
          </div>

          {/* Login Card */}
          <div className="bg-white border-2 border-[var(--border)] p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[var(--primary)] mb-2">Welcome Back</h2>
            <p className="text-[var(--text-secondary)] mb-6">Sign in to continue to your dashboard</p>
            
            {generalError && (
              <Alert variant="error" className="mb-4">
                {generalError}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                placeholder="you@example.com"
                disabled={loading}
              />

              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                placeholder="••••••••"
                disabled={loading}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 border-2 border-[var(--border)] text-[var(--primary)] focus:ring-[var(--accent)]"
                  />
                  <span className="ml-2 text-[var(--text-secondary)]">Remember me</span>
                </label>
                <button 
                  type="button"
                  onClick={() => setGeneralError('Password reset is coming soon. Please contact support.')}
                  className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                Sign In
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-[var(--text-secondary)]">Don't have an account? </span>
              <Link href="/auth/register" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-bold">
                Sign up
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-[var(--text-muted)] mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <LoginContent />
    </Suspense>
  );
}
