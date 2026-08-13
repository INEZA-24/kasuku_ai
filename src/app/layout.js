import "./globals.css";

export const metadata = {
  title: "Kasuku | Contextual Interpreter",
  description: "AI-powered contextual interpreter for everyday conversations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
