import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { useLanguage } from "@/hooks/useLanguage";
import { getMeta } from "@/i18n/meta";

const BASE_URL = "https://potmagic.com";

export const Route = createFileRoute("/($lang)/")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: getMeta(locale, "meta.home.title") },
        { name: "description", content: getMeta(locale, "meta.home.description") },
        { property: "og:title", content: getMeta(locale, "meta.home.ogTitle") },
        { property: "og:description", content: getMeta(locale, "meta.home.ogDescription") },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: getMeta(locale, "meta.home.title") },
        { name: "twitter:description", content: getMeta(locale, "meta.home.twitterDescription") },
      ],
      links: [
        { rel: "alternate", hrefLang: "en", href: `${BASE_URL}/` },
        { rel: "alternate", hrefLang: "de", href: `${BASE_URL}/de/` },
      ],
    };
  },
  component: LandingPage,
});

function LandingPage() {
  const { t, langPrefix } = useLanguage();

  return (
    <div className="bg-base-100 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      {/* Hero */}
      <main className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
            {/* Left — copy */}
            <div className="flex flex-col gap-6 lg:flex-1">
              <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                <span>
                  Live &nbsp;
                  <span className="text-rotate">
                    <span>
                      <span>{t('hero.rotate1')}</span>
                      <span>{t('hero.rotate2')}</span>
                      <span>{t('hero.rotate3')}</span>
                      <span>{t('hero.rotate4')}</span>
                      <span>{t('hero.rotate5')}</span>
                    </span>
                  </span>
                </span>

                <span className="text-base-content/60">
                  {t('hero.subline')}
                </span>
              </h1>
              <p className="text-base-content/50 max-w-md text-base leading-relaxed">
                {t('hero.body')}
              </p>
              <div>
                <Link
                  to={`${langPrefix}/auth` as any}
                  search={{ token: undefined } as any}
                  className="btn btn-accent btn-md font-display rounded-full px-8 tracking-wide"
                >
                  {t('hero.cta')}
                </Link>
              </div>
            </div>

            {/* Right — teaser image */}
            <div className="w-full lg:flex-1">
              <div className="border-base-300 grid aspect-3/2 items-center overflow-hidden rounded-2xl border shadow-xl">
                <figure className="hover-gallery">
                  <img src="/teaser1.png" />
                  <img src="/teaser2.png" />
                  <img src="/teaser3.png" />
                </figure>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
