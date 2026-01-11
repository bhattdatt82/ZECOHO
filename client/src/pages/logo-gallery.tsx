export default function LogoGallery() {
  const logos = [
    {
      name: "Option 1: Zero Commission",
      description: "Green '0' with location pin and 0% badge",
      src: "/logos/zecoho_zero_commission_logo.png"
    },
    {
      name: "Option 2: Hotel Pin",
      description: "Hotel building inside location pins",
      src: "/logos/zecoho_hotel_pin_logo.png"
    },
    {
      name: "Option 3: Connected Dots",
      description: "Pink and gray circles - direct connection concept",
      src: "/logos/zecoho_connected_dots_logo.png"
    },
    {
      name: "Option 4: Badge Shield",
      description: "Green shield with gold border and 0%",
      src: "/logos/zecoho_badge_shield_logo.png"
    }
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-2">ZECOHO Logo Options</h1>
        <p className="text-muted-foreground text-center mb-10">Choose your preferred logo design</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {logos.map((logo, index) => (
            <div key={index} className="bg-background rounded-xl p-6 shadow-md text-center">
              <div className="bg-white rounded-lg p-4 mb-4">
                <img 
                  src={logo.src} 
                  alt={logo.name}
                  className="w-48 h-48 mx-auto object-contain"
                />
              </div>
              <h3 className="font-semibold text-lg text-primary mb-1">{logo.name}</h3>
              <p className="text-muted-foreground text-sm">{logo.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
