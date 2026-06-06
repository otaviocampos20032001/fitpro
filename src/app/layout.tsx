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
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    if (init && init.headers) {
      var raw = init.headers;
      var safe = {};
      var entries = [];
      if (raw instanceof Headers) {
        raw.forEach(function(v, k) { entries.push([k, v]); });
      } else if (Array.isArray(raw)) {
        entries = raw;
      } else {
        entries = Object.entries(raw);
      }
      for (var i = 0; i < entries.length; i++) {
        var k = entries[i][0];
        var v = String(entries[i][1]).replace(/[^\\x00-\\xFF]/g, '');
        safe[k] = v;
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
