'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { updatePassword } from '@/lib/api';

interface StoredUser {
  id?: number;
  email: string;
  firstName?: string;
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  avatarDataUrl: string;
}

const EMPTY_PROFILE: ProfileForm = {
  firstName: '',
  lastName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  avatarDataUrl: '',
};

export default function AccountPage() {
  const router = useRouter();
  const { items } = useCart();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    const rawUser = localStorage.getItem('excito_user');
    if (!rawUser) return;

    try {
      const parsedUser = JSON.parse(rawUser) as StoredUser;
      setUser(parsedUser);
      const rawProfile = localStorage.getItem(`excito_profile_${parsedUser.email.toLowerCase()}`);

      if (rawProfile) {
        const parsedProfile = JSON.parse(rawProfile) as ProfileForm;
        setForm({ ...EMPTY_PROFILE, ...parsedProfile, firstName: parsedProfile.firstName || parsedUser.firstName || '' });
      } else {
        setForm((prev) => ({ ...prev, firstName: parsedUser.firstName || '' }));
      }
    } catch {
      setUser(null);
    }
  }, []);

  const initials = useMemo(() => {
    if (!user?.email) return 'U';
    const fn = form.firstName?.trim();
    const ln = form.lastName?.trim();
    if (fn || ln) return `${fn?.[0] || ''}${ln?.[0] || ''}`.toUpperCase() || 'U';
    return user.email[0].toUpperCase();
  }, [form.firstName, form.lastName, user]);

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      if (value) {
        setForm((prev) => ({ ...prev, avatarDataUrl: value }));
      }
    };
    reader.readAsDataURL(file);
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    localStorage.setItem(`excito_profile_${user.email.toLowerCase()}`, JSON.stringify(form));

    const updatedUser = { ...user, firstName: form.firstName || user.firstName || '' };
    localStorage.setItem('excito_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('excito-auth-changed'));

    setShowSavedPopup(true);
  };

  const onUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setPasswordError('');
    setPasswordStatus('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      setUpdatingPassword(true);
      const result = await updatePassword({
        email: user.email,
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      });
      setPasswordStatus(result.detail || 'Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-12">
        <div className="max-w-3xl mx-auto ui-card p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-500 dark:text-gray-300 font-semibold text-lg">
            U
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">Sign in to view your profile</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You need to login before accessing account details.</p>
          <Link href="/login" className="ui-btn-primary inline-block mt-5">Go to Login</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950 px-4 py-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="ui-card p-6 h-fit animate-section-in" style={{ animationDelay: '40ms' }}>
          {form.avatarDataUrl ? (
            <img
              src={form.avatarDataUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-800"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 font-bold text-xl">
              {initials}
            </div>
          )}
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">{form.firstName || user.firstName || 'Excito User'}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>

          <div className="mt-6 space-y-2 text-sm">
            <Link href="/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200">
              <i className="ri-file-list-line"></i>
              <span>My Orders</span>
            </Link>
            <Link href="/wishlist" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200">
              <i className="ri-heart-line"></i>
              <span>Wishlist</span>
            </Link>
            <Link href="/cart" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200">
              <i className="ri-shopping-cart-line"></i>
              <span>Cart</span>
            </Link>
          </div>
        </aside>

        <section className="lg:col-span-2 ui-card p-6 sm:p-8 animate-section-in" style={{ animationDelay: '80ms' }}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal and shipping details.</p>

          <form onSubmit={onSave} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Profile Photo</label>
              <div className="flex items-center gap-4">
                {form.avatarDataUrl ? (
                  <img
                    src={form.avatarDataUrl}
                    alt="Profile preview"
                    className="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-gray-800"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-500 dark:text-gray-300 font-semibold">
                    {initials}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="ui-btn-secondary cursor-pointer">
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                  </label>
                  {form.avatarDataUrl && (
                    <button
                      type="button"
                      className="ui-btn-secondary text-red-600"
                      onClick={() => setForm((prev) => ({ ...prev, avatarDataUrl: '' }))}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">First name</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="ui-input" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Last name</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="ui-input" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input value={user.email} disabled className="ui-input opacity-70 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="ui-input" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Address line 1</label>
              <input value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} className="ui-input" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Address line 2</label>
              <input value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} className="ui-input" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="ui-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">State</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="ui-input" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Postal code</label>
                <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="ui-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="ui-input" />
              </div>
            </div>

            <button type="submit" className="ui-btn-primary w-full sm:w-auto">Save Profile</button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Update Password</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Keep your account secure by using a strong password.</p>

            {passwordStatus && <p className="mt-4 text-sm text-emerald-600">{passwordStatus}</p>}
            {passwordError && <p className="mt-4 text-sm text-red-600">{passwordError}</p>}

            <form onSubmit={onUpdatePassword} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="ui-input"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="ui-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="ui-input"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={updatingPassword} className="ui-btn-secondary w-full sm:w-auto">
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Added to Cart Products</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quick view of products currently in your cart.</p>

            {items.length === 0 ? (
              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
                No products in cart yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {items.slice(0, 6).map((item, idx) => (
                  <div key={`${item.product.id}-${idx}`} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Qty {item.quantity} · {item.size || 'Size -'} · {item.color || 'Color -'}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Rs {Number(item.product.price).toLocaleString()}</p>
                  </div>
                ))}
                <Link href="/cart" className="ui-btn-primary inline-block mt-2">Open Cart</Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {showSavedPopup && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="ui-card p-6 max-w-sm w-full text-center animate-section-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 mx-auto flex items-center justify-center">
              <i className="ri-check-line text-2xl text-emerald-600"></i>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">Profile Saved</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Profile saved successfully.</p>
            <button
              onClick={() => {
                setShowSavedPopup(false);
                router.replace('/account');
              }}
              className="ui-btn-primary w-full mt-5"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
