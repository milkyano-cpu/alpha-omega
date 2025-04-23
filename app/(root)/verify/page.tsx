import { Suspense } from "react";
import { VerificationForm } from "@/components/verification-form";

export default function Verify() {
  return (
    <main className="flex flex-col gap-8 mt-10">
      <section className="flex flex-col gap-8 min-h-[calc(100vh-100px)] justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <VerificationForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
