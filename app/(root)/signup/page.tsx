import { SignUpForm } from "@/components/sign-up-form";

export default function SignUp() {
  return (
    <main className="flex flex-col gap-20 mt-22">
      <section className="flex flex-col gap-8 pt-20 h-screen justify-center items-center px-4">
        <SignUpForm />
      </section>
    </main>
  );
}
