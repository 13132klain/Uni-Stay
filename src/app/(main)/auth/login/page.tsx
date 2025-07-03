import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 px-4">
      <LoginForm />
    </div>
  );
}
