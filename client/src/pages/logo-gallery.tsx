import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { BRAND_BG_COLOR, BRAND_BG_COLOR_LIGHT, BRAND_TEXT_COLOR } from "@/constants/brand";

function LogoSVG({ size = 200 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={BRAND_BG_COLOR_LIGHT} />
          <stop offset="100%" stopColor={BRAND_BG_COLOR} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="32" fill="url(#logoGradient)" />
      <text 
        x="18" 
        y="118" 
        fill={BRAND_TEXT_COLOR} 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontSize="42" 
        fontWeight="700"
        letterSpacing="1"
      >
        ZECOH
      </text>
      <svg x="145" y="75" width="40" height="40" viewBox="0 0 24 24">
        <path 
          d="M 18.36 5.64 A 9 9 0 1 0 20.5 10" 
          stroke={BRAND_TEXT_COLOR} 
          strokeWidth="2.5" 
          strokeLinecap="round"
          fill="none" 
        />
        <circle cx="12" cy="12" r="2.5" fill={BRAND_TEXT_COLOR} />
      </svg>
    </svg>
  );
}

function downloadSVG() {
  const svgContent = `<svg width="512" height="512" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_BG_COLOR_LIGHT}" />
      <stop offset="100%" stop-color="${BRAND_BG_COLOR}" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="32" fill="url(#logoGradient)" />
  <text x="18" y="118" fill="${BRAND_TEXT_COLOR}" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="700" letter-spacing="1">ZECOH</text>
  <svg x="145" y="75" width="40" height="40" viewBox="0 0 24 24">
    <path d="M 18.36 5.64 A 9 9 0 1 0 20.5 10" stroke="${BRAND_TEXT_COLOR}" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <circle cx="12" cy="12" r="2.5" fill="${BRAND_TEXT_COLOR}" />
  </svg>
</svg>`;
  
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'zecoho-logo.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadPNG(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, BRAND_BG_COLOR_LIGHT);
  gradient.addColorStop(1, BRAND_BG_COLOR);

  const radius = size * 0.16;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.fillStyle = BRAND_TEXT_COLOR;
  ctx.font = `700 ${size * 0.21}px system-ui, -apple-system, sans-serif`;
  ctx.fillText('ZECOH', size * 0.09, size * 0.59);

  // Draw the special O symbol matching header logo exactly
  // The O is positioned at x=145, y=75 in a 200x200 viewBox, scaled to 40x40
  const oOffsetX = size * 0.725; // 145/200
  const oOffsetY = size * 0.375; // 75/200
  const oSize = size * 0.2;     // 40/200
  const scale = oSize / 24;      // Scale from 24x24 viewBox
  
  // Center of the O symbol in canvas coordinates
  const oCenterX = oOffsetX + (12 * scale);
  const oCenterY = oOffsetY + (12 * scale);
  const oRadius = 9 * scale;
  
  // Draw the arc (almost complete circle with gap at top-right)
  // Original path: M 18.36 5.64 A 9 9 0 1 0 20.5 10
  // This creates a circle from angle ~-45deg going almost all the way around
  ctx.beginPath();
  ctx.arc(oCenterX, oCenterY, oRadius, -0.75 * Math.PI, 0.35 * Math.PI, true);
  ctx.strokeStyle = BRAND_TEXT_COLOR;
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Draw the rest of the arc (completing most of the circle)
  ctx.beginPath();
  ctx.arc(oCenterX, oCenterY, oRadius, 0.35 * Math.PI, -0.75 * Math.PI, false);
  ctx.stroke();
  
  // Draw center dot
  ctx.beginPath();
  ctx.arc(oCenterX, oCenterY, 2.5 * scale, 0, 2 * Math.PI);
  ctx.fillStyle = BRAND_TEXT_COLOR;
  ctx.fill();

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zecoho-logo-${size}x${size}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export default function LogoGallery() {
  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-2">ZECOHO Logo Download</h1>
        <p className="text-muted-foreground text-center mb-10">Download the official ZECOHO logo for social media and branding</p>
        
        <div className="flex justify-center mb-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Official ZECOHO Logo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="bg-white p-8 rounded-xl shadow-inner">
                <LogoSVG size={200} />
              </div>
              
              <div className="w-full space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Vector Format (SVG)</p>
                  <Button onClick={downloadSVG} className="w-full" data-testid="button-download-svg">
                    <Download className="h-4 w-4 mr-2" />
                    Download SVG
                  </Button>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">PNG Formats</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => downloadPNG(512)} data-testid="button-download-png-512">
                      <Download className="h-4 w-4 mr-2" />
                      512x512
                    </Button>
                    <Button variant="outline" onClick={() => downloadPNG(1024)} data-testid="button-download-png-1024">
                      <Download className="h-4 w-4 mr-2" />
                      1024x1024
                    </Button>
                    <Button variant="outline" onClick={() => downloadPNG(256)} data-testid="button-download-png-256">
                      <Download className="h-4 w-4 mr-2" />
                      256x256
                    </Button>
                    <Button variant="outline" onClick={() => downloadPNG(128)} data-testid="button-download-png-128">
                      <Download className="h-4 w-4 mr-2" />
                      128x128
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Recommended sizes for social media:</p>
          <ul className="mt-2 space-y-1">
            <li>Instagram/Facebook Profile: 512x512 or 1024x1024</li>
            <li>Twitter/X Profile: 512x512</li>
            <li>WhatsApp: 512x512</li>
            <li>LinkedIn: 512x512</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
