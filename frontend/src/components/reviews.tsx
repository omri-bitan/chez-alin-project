import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/section-heading";
import { property } from "@/lib/property-data";

export function Reviews() {
  return (
    <section id="reviews" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="Guest Reviews"
          subtitle="What our guests say about their stay"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Rating Score Card */}
          <div className="flex flex-col items-center gap-4 lg:sticky lg:top-8">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent ring-1 ring-amber-500/20 px-10 py-8 w-full">
              <div className="text-6xl font-bold text-amber-400 tracking-tight">
                {property.rating.toFixed(1)}
              </div>
              <div className="text-lg font-semibold text-zinc-200">
                {property.ratingLabel}
              </div>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={i < Math.round(property.rating / 2) ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`size-5 ${
                      i < Math.round(property.rating / 2)
                        ? "text-amber-400"
                        : "text-zinc-600"
                    }`}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Based on {property.reviewCount} review{property.reviewCount !== 1 ? "s" : ""}
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-amber-500/30 text-amber-300 px-4 py-1.5 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 mr-1.5">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Location {property.locationRating}/10
            </Badge>
          </div>

          {/* Reviews */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {property.reviews.map((review, index) => (
              <Card
                key={index}
                className="bg-zinc-900/50 ring-amber-500/10 border-none border-l-2 border-l-amber-500/30"
              >
                <CardContent className="pt-2">
                  {/* Quotation mark */}
                  <div className="text-8xl leading-none text-amber-500/30 font-serif select-none mb-2">
                    &ldquo;
                  </div>
                  <blockquote className="text-base text-zinc-300 italic leading-relaxed -mt-4 pl-2">
                    {review.text}
                  </blockquote>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-sm font-semibold">
                        {review.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {review.author}
                        </p>
                        <p className="text-xs text-zinc-500">Verified Guest</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5">
                      <span className="text-sm font-bold text-amber-400">
                        {review.score}
                      </span>
                      <span className="text-xs text-amber-400/70">/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 p-6 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent ring-1 ring-amber-500/10">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-base font-medium text-zinc-200">
                  Ready to experience Chamonix?
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  Book your stay at Chez Aline and create your own memories.
                </p>
              </div>
              <a href={property.bookingUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold px-6 h-10 shrink-0"
                >
                  Book Now
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
