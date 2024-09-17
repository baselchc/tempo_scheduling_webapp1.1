import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs"; 

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Tempo Scheduling",
  description: "Tempo platform for scheduling",
};

//Snippet created by AI (GPT 4o), Prompt is, integrate the clerk platform to this next.js project, here is the layout.js and page.js : 

export default function RootLayout({ children }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

