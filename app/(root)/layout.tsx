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
      <VerificationRequired>
        {children}
      </VerificationRequired>
      <Footer />
    </>
  );
}
