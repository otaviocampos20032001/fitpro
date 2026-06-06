import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Otavio Fontes | Personal e Consultoria-ON",
  description: "Plataforma de treinos personalizados — Otavio Fontes Personal e Consultoria-ON",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OF Personal",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
(function() {
  function sanitize(v) {
    return String(v == null ? '' : v).replace(/[^\\x00-\\xFF]/g, '');
  }

  // Patch Headers.prototype.set and .append
  var _hSet = Headers.prototype.set;
  var _hAppend = Headers.prototype.append;
  Headers.prototype.set = function(name, value) {
    return _hSet.call(this, name, sanitize(value));
  };
  Headers.prototype.append = function(name, value) {
    return _hAppend.call(this, name, sanitize(value));
  };

  // Patch fetch to also sanitize plain-object headers
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    if (init && init.headers && !(init.headers instanceof Headers)) {
      var raw = init.headers;
      var safe = {};
      var entries = Array.isArray(raw) ? raw : Object.entries(raw);
      for (var i = 0; i < entries.length; i++) {
        safe[entries[i][0]] = sanitize(entries[i][1]);
      }
      init = Object.assign({}, init, { headers: safe });
    }
    return _fetch.call(this, input, init);
  };
})();
        `}} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
