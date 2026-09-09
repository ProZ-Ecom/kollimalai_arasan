
import {
  HeroSlider,
  CategorySection,
  ProductSection,
  Banner,
  Pledge,
  Tradition,
  Features,
  Feedback,
  OfferPopup,
  OfferReels,
} from "@/components/storefront";

export default function HomePage() {
  return (
    <div className="pb-16 lg:pb-0 bg-white">
      <OfferPopup />
      <HeroSlider />
      <CategorySection />
      <ProductSection />
      <Banner />
      <OfferReels />
      <Pledge />
      <Tradition />
      <Features />
      <Feedback />
    </div>
  );
}
