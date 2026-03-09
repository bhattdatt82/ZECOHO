import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";

function downloadImageAsPng(imageUrl: string, size: number) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw the uploaded logo scaled to the requested size
    ctx.drawImage(img, 0, 0, size, size);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zecoho-logo-${size}x${size}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  img.onerror = () => {
    // Fallback: direct download of the original file
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `zecoho-logo-${size}x${size}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  img.src = imageUrl;
}

function downloadOriginal(imageUrl: string, logoAlt: string) {
  const ext = imageUrl.split(".").pop()?.split("?")[0] || "png";
  const a = document.createElement("a");
  a.href = imageUrl;
  a.download = `zecoho-logo.${ext}`;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function LogoGallery() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: siteSettings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });

  const logoUrl = siteSettings?.logoUrl;
  const logoAlt = siteSettings?.logoAlt || "ZECOHO";

  // Resolve full URL: accessPath like /objects/... needs the base URL
  const resolvedLogoUrl = logoUrl
    ? logoUrl.startsWith("http")
      ? logoUrl
      : `${window.location.origin}${logoUrl}`
    : null;

  const handleDownloadPng = async (size: number) => {
    if (!resolvedLogoUrl) return;
    const key = `png-${size}`;
    setDownloading(key);
    try {
      downloadImageAsPng(resolvedLogoUrl, size);
    } finally {
      setTimeout(() => setDownloading(null), 1500);
    }
  };

  const handleDownloadOriginal = () => {
    if (!resolvedLogoUrl) return;
    downloadOriginal(resolvedLogoUrl, logoAlt);
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-2">ZECOHO Logo Download</h1>
        <p className="text-muted-foreground text-center mb-10">
          Download the official ZECOHO logo for social media and branding
        </p>

        <div className="flex justify-center mb-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Official ZECOHO Logo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="bg-white p-8 rounded-xl w-full flex items-center justify-center min-h-[200px]">
                {isLoading ? (
                  <div className="w-32 h-32 rounded-xl bg-muted animate-pulse" />
                ) : resolvedLogoUrl ? (
                  <img
                    src={resolvedLogoUrl}
                    alt={logoAlt}
                    style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "contain" }}
                    data-testid="img-logo-preview"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-12 h-12" />
                    <p className="text-sm">No logo uploaded yet</p>
                    <p className="text-xs">Upload a logo via Admin &rarr; Logo &amp; Branding</p>
                  </div>
                )}
              </div>

              {resolvedLogoUrl && (
                <div className="w-full space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Original File</p>
                    <Button
                      onClick={handleDownloadOriginal}
                      className="w-full"
                      data-testid="button-download-original"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Original
                    </Button>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">PNG — Resized Copies</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { size: 1024, label: "1024×1024" },
                        { size: 512, label: "512×512" },
                        { size: 256, label: "256×256" },
                        { size: 128, label: "128×128" },
                      ].map(({ size, label }) => (
                        <Button
                          key={size}
                          variant="outline"
                          onClick={() => handleDownloadPng(size)}
                          disabled={downloading === `png-${size}`}
                          data-testid={`button-download-png-${size}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {downloading === `png-${size}` ? "Saving…" : label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Recommended sizes for social media:</p>
          <ul className="mt-2 space-y-1">
            <li>Instagram / Facebook Profile: 512×512 or 1024×1024</li>
            <li>Twitter / X Profile: 512×512</li>
            <li>WhatsApp: 512×512</li>
            <li>LinkedIn: 512×512</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
