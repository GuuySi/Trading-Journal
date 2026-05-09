import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ email, password }: FormValues) {
    try {
      setError('');
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Login failed';
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">TradingLog</h1>
          <p className="text-sm text-zinc-500 mt-1">Your professional trading journal</p>
        </div>

        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-zinc-100">Sign in</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="trader@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <p className="text-sm text-loss bg-loss-muted rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            No account?{' '}
            <Link to="/register" className="text-accent hover:text-accent/80 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
