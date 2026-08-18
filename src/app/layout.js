import "./globals.css";

export const metadata = {
  title: {
    default: "Kasuku | Rwanda-focused contextual interpreter",
    template: "%s | Kasuku",
  },
  description:
    "Kasuku helps two people communicate naturally across English and Kinyarwanda on one shared phone.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
