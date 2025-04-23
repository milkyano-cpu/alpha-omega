import { SignUpForm } from "@/components/sign-up-form";

export default function SignUp() {
  return (
    <main className="flex flex-col gap-8 mt-5">
      <section className="flex flex-col gap-8 min-h-[calc(100vh-100px)] justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">
          <SignUpForm />
        </div>
      </section>
    </main>
  );
}
