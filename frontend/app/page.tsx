import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { BookingWidget } from "@/components/booking-widget";
import { Gallery } from "@/components/gallery";
import { About } from "@/components/about";
import { Amenities } from "@/components/amenities";
import { Location } from "@/components/location";
import { Reviews } from "@/components/reviews";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BookingWidget />
        <Gallery />
        <About />
        <Amenities />
        <Location />
        <Reviews />
      </main>
      <Footer />
    </>
  );
}
