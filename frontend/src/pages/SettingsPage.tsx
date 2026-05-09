import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStrategies, useCreateStrategy } from '@/hooks/useTrades';
import { strategiesApi } from '@/lib/api';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';
import { tradeKeys } from '@/hooks/useTrades';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Required'),
});

const passwordSchema = z.object({
  password: z.string().min(8, 'Min 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export function SettingsPage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const { data: strategies } = useStrategies();
  const createStrategy = useCreateStrategy();
  const [newStrategyName, setNewStrategyName] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { displayName: user?.displayName ?? '' } });

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  async function saveProfile(data: { displayName: string }) {
    await authApi.updateProfile(data);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  async function savePassword(data: PasswordForm) {
    await authApi.updateProfile({ password: data.password });
    resetPassword();
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  }

  async function addStrategy() {
    if (!newStrategyName.trim()) return;
    await createStrategy.mutateAsync({ name: newStrategyName.trim() });
    setNewStrategyName('');
  }

  async function deleteStrategy(id: string) {
    await strategiesApi.delete(id);
    qc.invalidateQueries({ queryKey: tradeKeys.strategies });
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>

      {/* Profile */}
      <div className="card space-y-4">
        <h2 className="card-header">Profile</h2>
        <p className="text-sm text-zinc-500">{user?.email}</p>

        <form onSubmit={handleProfile(saveProfile)} className="space-y-4">
          <Input
            label="Display Name"
            error={profileErrors.displayName?.message}
            {...regProfile('displayName')}
          />
          <Button type="submit" loading={profileSubmitting} size="sm">
            {profileSaved ? 'Saved ✓' : 'Save Profile'}
          </Button>
        </form>
      </div>

      {/* Password */}
      <div className="card space-y-4">
        <h2 className="card-header">Change Password</h2>
        <form onSubmit={handlePassword(savePassword)} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="Min. 8 characters"
            error={passwordErrors.password?.message}
            {...regPassword('password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            error={passwordErrors.confirm?.message}
            {...regPassword('confirm')}
          />
          <Button type="submit" loading={passwordSubmitting} size="sm">
            {passwordSaved ? 'Updated ✓' : 'Update Password'}
          </Button>
        </form>
      </div>

      {/* Strategies */}
      <div className="card space-y-4">
        <h2 className="card-header">Strategies</h2>
        <p className="text-xs text-zinc-500">
          Create strategies to tag and analyze your setups.
        </p>

        <div className="flex gap-2">
          <input
            className="input-base flex-1"
            placeholder="Strategy name (e.g. SMC, Breakout, OB Rejection...)"
            value={newStrategyName}
            onChange={(e) => setNewStrategyName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addStrategy();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={addStrategy}
            loading={createStrategy.isPending}
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {strategies?.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-3 py-2 bg-surface-3 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-zinc-200">{s.name}</p>
                {s._count && (
                  <p className="text-xs text-zinc-500">{s._count.trades} trades</p>
                )}
              </div>
              <button
                onClick={() => deleteStrategy(s.id)}
                className="text-zinc-600 hover:text-loss transition-colors p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {!strategies?.length && (
            <p className="text-sm text-zinc-600 text-center py-4">
              No strategies yet
            </p>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-loss/20">
        <h2 className="card-header text-loss">Danger Zone</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Sign out of your account on this device.
        </p>
        <Button variant="danger" onClick={logout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
