
import {
  HeroSlider,
  BrandPromise,
  ProductSection,
  LowestPrice,
  WhyChooseUs,
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
      <BrandPromise />
      <OfferReels />
      <ProductSection title="Freshly Launched" accent="Flavours" />
      <WhyChooseUs />
      <LowestPrice />
      <Features />
      <Feedback />
    </div>
  );
}
