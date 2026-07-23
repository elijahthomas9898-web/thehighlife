import ScrollEffects from "./components/ScrollEffects";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import { Marquee, DealsIntro, DealsGallery } from "./components/Deals";
import Categories from "./components/Categories";
import Stats from "./components/Stats";
import Visit from "./components/Visit";
import Footer from "./components/Footer";

export default function Page() {
  return (
    <>
      {/* wires up the scroll rail, hero parallax, reveals, count-ups and pinned gallery */}
      <ScrollEffects />
      <div className="rail" id="rail" />
      <Nav />
      <Hero />
      <Marquee />
      <DealsIntro />
      <DealsGallery />
      <Categories />
      <Stats />
      <Visit />
      <Footer />
    </>
  );
}
