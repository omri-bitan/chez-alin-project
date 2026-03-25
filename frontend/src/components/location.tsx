import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/section-heading";
import { property } from "@/lib/property-data";

const typeLabels: Record<string, string> = {
  transit: "Transit",
  attraction: "Attractions",
  restaurant: "Dining",
};

const typeIcons: Record<string, React.ReactNode> = {
  transit: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <rect width="16" height="16" x="4" y="3" rx="2" />
      <path d="M4 11h16" />
      <path d="M12 3v8" />
      <path d="m8 19-2 3" />
      <path d="m18 22-2-3" />
      <path d="M8 15h.01" />
      <path d="M16 15h.01" />
    </svg>
  ),
  attraction: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  restaurant: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  ),
};

export function Location() {
  const grouped = property.nearby.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, typeof property.nearby>
  );

  const groupOrder = ["transit", "attraction", "restaurant"];

  return (
    <section id="location" className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-950/50">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="Location"
          subtitle="In the heart of Chamonix-Mont-Blanc"
        />

        {/* Address */}
        <div className="flex items-center justify-center gap-2 mb-10 text-zinc-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-amber-400">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-base font-medium">{property.address}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map */}
          <div className="overflow-hidden rounded-2xl shadow-xl shadow-black/30 ring-1 ring-amber-500/10 aspect-[4/3] lg:aspect-auto lg:min-h-[420px]">
            <iframe
              src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2774.5!2d${property.coordinates.lng}!3d${property.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDU1JzI1LjMiTiA2wrA1MicwOS44IkU!5e0!3m2!1sen!2sfr!4v1`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "100%" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Chez Aline location on Google Maps"
              className="grayscale-[30%] contrast-[1.1]"
            />
          </div>

          {/* Nearby */}
          <div className="flex flex-col gap-8">
            {groupOrder.map((type) => {
              const items = grouped[type];
              if (!items) return null;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-amber-400">{typeIcons[type]}</span>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">
                      {typeLabels[type]}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-lg bg-zinc-900/50 px-4 py-3 ring-1 ring-white/5 hover:border-amber-500/20 hover:ring-amber-500/15 transition-colors"
                      >
                        <span className="text-sm text-zinc-300">
                          {item.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/10 text-amber-300 border-amber-500/20 shrink-0 ml-3"
                        >
                          {item.distance}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
