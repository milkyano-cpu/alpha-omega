import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { VerificationRequired } from "@/components/verification-required";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <div className="pt-8">
        <VerificationRequired>
          {children}
        </VerificationRequired>
      </div>
      <Footer />
    </>
  );
}
