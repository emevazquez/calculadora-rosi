import { PricingCalculator } from "@/components/PricingCalculator";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fff0f5] to-[#ffe4e1] flex flex-col items-center py-12 px-4 sm:px-6 font-sans">
      <div className="w-full max-w-md mb-8 text-center">
        <h1 className="text-4xl font-serif font-bold tracking-tight text-[#d87093] drop-shadow-sm">
          Calculadora de Rosi 🎀
        </h1>
        <p className="text-[#db7093] mt-2 text-sm font-medium opacity-80">
          Para que vendas lindo y rápido ✨
        </p>
      </div>
      
      <PricingCalculator />
    </main>
  );
}
