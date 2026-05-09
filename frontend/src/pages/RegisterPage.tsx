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
  displayName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ email, password, displayName }: FormValues) {
    try {
      setError('');
      await registerUser(email, password, displayName);
      navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Registration failed';
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">TradingLog</h1>
          <p className="text-sm text-zinc-500 mt-1">Start your trading journal</p>
        </div>

        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-zinc-100">Create account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Display Name"
              placeholder="Your name"
              error={errors.displayName?.message}
              {...register('displayName')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="trader@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <p className="text-sm text-loss bg-loss-muted rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
