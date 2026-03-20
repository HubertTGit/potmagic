import { Link } from "@tanstack/react-router";
import { XIcon, InstagramIcon, YoutubeIcon } from "lucide-react";

const LINKS = {
  Platform: [
    { label: "Watch Live", to: "/show" },
    { label: "Pricing", to: "/pricing" },
    { label: "Concept", to: "/concept" },
    { label: "Docs", to: "/docs" },
  ],
  Company: [{ label: "Join Theatre", to: "/auth" }],
};

const SOCIAL = [
  { label: "Twitter / X", icon: XIcon, href: "https://twitter.com" },
  { label: "Instagram", icon: InstagramIcon, href: "https://instagram.com" },
  { label: "YouTube", icon: YoutubeIcon, href: "https://youtube.com" },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-base-300 border-base-300 text-base-content border-t">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <Link
              to="/"
              className="inline-block transition-opacity hover:opacity-75"
            >
              <img src="/icon-black.svg" alt="potmagic" className="h-5 opacity-50 dark:hidden" />
              <img src="/icon-white.svg" alt="potmagic" className="h-5 hidden opacity-50 dark:block" />
            </Link>
            <p className="text-base-content/60 max-w-xs text-sm leading-relaxed">
              Step into the digital spotlight. Join our online community theatre
              and perform live from anywhere.
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
                Keep in touch
              </span>
              <div className="flex items-center gap-3">
                {SOCIAL.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-base-content/40 hover:text-base-content transition-colors"
                  >
                    <Icon className="size-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading} className="flex flex-col gap-3">
              <span className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
                {heading}
              </span>
              <ul className="flex flex-col gap-2">
                {links.map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-base-content/60 hover:text-base-content text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-base-content/10 border-t">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-base-content/30 text-xs">
            potmagic © {year} All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
