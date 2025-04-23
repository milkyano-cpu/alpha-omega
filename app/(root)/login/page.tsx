import { LoginForm } from "@/components/login-form";

export default function Login() {
  return (
    <main className="flex flex-col gap-8 mt-10">
      <section className="flex flex-col gap-8 min-h-[calc(100vh-100px)] justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
