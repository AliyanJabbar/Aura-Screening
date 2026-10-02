import Hero from "@/components/home/hero";
import FeatureGrid from "@/components/home/feature-grid";
import CtaBanner from "@/components/home/cta-banner";
import ProductMockup from "@/components/home/product-mockup";
import StatSection from "@/components/home/stat-section";
import Pricing from "@/components/home/pricing";

export default function Home() {
  return (
    <div className="flex flex-col pb-10">
      <Hero />

      <ProductMockup />

      <StatSection />

      <FeatureGrid />

      <Pricing />

      <CtaBanner />
    </div>
  );
}