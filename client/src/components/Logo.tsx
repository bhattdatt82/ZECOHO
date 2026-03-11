import { useQuery } from "@tanstack/react-query";

interface SiteSettingsData {
  logoUrl?: string | null;
  logoAlt?: string | null;
}

function useSiteSettings() {
  return useQuery<SiteSettingsData>({
    queryKey: ["/api/site-settings"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

const DEFAULT_LOGO = "/logo-512.png";

export function Logo({ className = "" }: { className?: string }) {
  const { data: siteSettings } = useSiteSettings();
  const logoUrl = siteSettings?.logoUrl || DEFAULT_LOGO;
  const logoAlt = siteSettings?.logoAlt || "ZECOHO";

  return (
    <div className={`flex items-center shrink-0 ${className}`}>
      <img
        src={logoUrl}
        alt={logoAlt}
        style={{ height: "36px", width: "auto", maxWidth: "180px", objectFit: "contain", display: "block" }}
        data-testid="img-site-logo"
      />
    </div>
  );
}

export function LogoText({ className = "" }: { className?: string }) {
  const { data: siteSettings } = useSiteSettings();
  const logoUrl = siteSettings?.logoUrl || DEFAULT_LOGO;
  const logoAlt = siteSettings?.logoAlt || "ZECOHO";

  return (
    <span className={`flex items-center shrink-0 ${className}`}>
      <img
        src={logoUrl}
        alt={logoAlt}
        style={{ height: "28px", width: "auto", maxWidth: "160px", objectFit: "contain", display: "block" }}
        data-testid="img-site-logo-text"
      />
    </span>
  );
}
