"use client";

import { useState } from "react";
import Image from "next/image";
import { property } from "@/lib/property-data";
import { Separator } from "@/components/ui/separator";
import { ScrollReveal } from "./scroll-reveal";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function Gallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const images = property.images;

  return (
    <section id="gallery" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section heading */}
      <div className="flex flex-col items-center mb-16">
        <span className="text-xs font-light tracking-[0.4em] uppercase text-[oklch(0.75_0.15_85)] mb-4">
          Discover
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-[0.15em] uppercase text-white/90 mb-6">
          Gallery
        </h2>
        <Separator className="w-16 bg-[oklch(0.75_0.15_85/0.4)]" />
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 auto-rows-[180px] sm:auto-rows-[220px] md:auto-rows-[200px]">
        {images.slice(0, 7).map((image, index) => (
          <ScrollReveal
            key={index}
            delay={index * 100}
            className={index === 0 ? "col-span-2 row-span-2" : ""}
          >
            <button
              onClick={() => setSelectedImage(index)}
              className="group relative overflow-hidden rounded-lg cursor-pointer w-full h-full"
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                sizes={index === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                unoptimized
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[oklch(0.13_0_0/0)] group-hover:bg-[oklch(0.13_0_0/0.3)] transition-colors duration-500" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border border-white/40 flex items-center justify-center backdrop-blur-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </div>
              </div>
              {/* Subtle border */}
              <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5" />
            </button>
          </ScrollReveal>
        ))}
      </div>

      {/* Lightbox dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent
          className="sm:max-w-4xl max-w-[95vw] p-0 bg-[oklch(0.1_0_0/0.98)] border-none ring-0 overflow-hidden"
          showCloseButton
        >
          <DialogTitle className="sr-only">
            {selectedImage !== null ? images[selectedImage].alt : "Image preview"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full-size view of the property image
          </DialogDescription>
          {selectedImage !== null && (
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={images[selectedImage].url}
                alt={images[selectedImage].alt}
                fill
                className="object-contain"
                sizes="95vw"
                unoptimized
              />
            </div>
          )}

          {/* Navigation dots */}
          {selectedImage !== null && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button
                onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1)}
                className="text-white/50 hover:text-white transition-colors p-2"
                aria-label="Previous image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className="flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === selectedImage
                        ? "w-6 bg-[oklch(0.75_0.15_85)]"
                        : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`View image ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0)}
                className="text-white/50 hover:text-white transition-colors p-2"
                aria-label="Next image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
