"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Store } from "lucide-react";

type PaymentMethodId = "efectivo" | "transferencia" | "mp_debito" | "cuota_3" | "mp_credito" | "cuota_6" | "cuenta_corriente";

interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  group: "green" | "orange" | "red" | "blue";
  calculate: (basePrice: number, extraParam?: number) => { finalPrice: number; installment: number | null; netReceived: number };
}

// Helper for gross-up formula: Final Price = Base Price / (1 - Deduction)
const calculateGrossUp = (basePrice: number, feePercentage: number, applyIvaToFee = true) => {
  const effectiveFee = applyIvaToFee ? feePercentage * 1.21 : feePercentage;
  const finalPrice = basePrice / (1 - effectiveFee);
  return finalPrice;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  // Green (No fees)
  {
    id: "efectivo",
    label: "Efectivo",
    group: "green",
    calculate: (basePrice) => ({ finalPrice: basePrice, installment: null, netReceived: basePrice }),
  },
  {
    id: "transferencia",
    label: "Transferencia",
    group: "green",
    calculate: (basePrice) => ({ finalPrice: basePrice, installment: null, netReceived: basePrice }),
  },
  // Blue (Custom Interest)
  {
    id: "cuenta_corriente",
    label: "Cuenta Corriente",
    group: "blue",
    calculate: (basePrice, interestRate = 0) => {
      const finalPrice = basePrice * (1 + interestRate / 100);
      return { finalPrice, installment: null, netReceived: finalPrice };
    },
  },
  // Orange (Moderate fees)
  {
    id: "mp_debito",
    label: "MP Débito",
    group: "orange",
    calculate: (basePrice) => ({
      finalPrice: calculateGrossUp(basePrice, 0.0339),
      installment: null,
      netReceived: basePrice,
    }),
  },
  {
    id: "cuota_3",
    label: "Cuota Simple 3",
    group: "orange",
    calculate: (basePrice) => {
      const finalPrice = basePrice * 1.065461;
      return { finalPrice, installment: finalPrice / 3, netReceived: basePrice };
    },
  },
  // Red (High fees)
  {
    id: "mp_credito",
    label: "MP Crédito (1 Pago)",
    group: "red",
    calculate: (basePrice) => ({
      finalPrice: calculateGrossUp(basePrice, 0.0649),
      installment: null,
      netReceived: basePrice,
    }),
  },
  {
    id: "cuota_6",
    label: "Cuota Simple 6",
    group: "red",
    calculate: (basePrice) => {
      const finalPrice = basePrice * 1.124751;
      return { finalPrice, installment: finalPrice / 6, netReceived: basePrice };
    },
  }
];

export function PricingCalculator() {
  const [activeTab, setActiveTab] = useState<string>("pos");

  // POS State
  const [basePriceStr, setBasePriceStr] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>("efectivo");
  const [ccInterestStr, setCcInterestStr] = useState<string>("15"); // Default 15%
  
  // Pricing State
  const [costStr, setCostStr] = useState<string>("");
  const [markupStr, setMarkupStr] = useState<string>("50"); // Default 50% markup
  
  const inputRef = useRef<HTMLInputElement>(null);
  const costInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "pos" && inputRef.current) {
      inputRef.current.focus();
    } else if (activeTab === "pricing" && costInputRef.current) {
      costInputRef.current.focus();
    }
  }, [activeTab]);

  // Calculations
  const basePrice = parseFloat(basePriceStr) || 0;
  const ccInterest = parseFloat(ccInterestStr) || 0;
  
  const currentMethod = PAYMENT_METHODS.find(m => m.id === selectedMethod)!;
  const { finalPrice, installment, netReceived } = currentMethod.calculate(basePrice, ccInterest);
  
  const cost = parseFloat(costStr) || 0;
  const markup = parseFloat(markupStr) || 0;
  const suggestedPrice = cost * (1 + markup / 100);

  // Format numbers to ARS currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleSendToPos = () => {
    setBasePriceStr(suggestedPrice.toFixed(2));
    setActiveTab("pos");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/60 backdrop-blur-sm p-1 rounded-2xl border border-[#ffb6c1]/30">
          <TabsTrigger value="pos" className="rounded-xl data-[state=active]:bg-[#ffb6c1] data-[state=active]:text-white data-[state=active]:shadow-md text-[#db7093] text-sm font-semibold transition-all">
            <Store className="w-4 h-4 mr-2" />
            Vender 💖
          </TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-xl data-[state=active]:bg-[#ffb6c1] data-[state=active]:text-white data-[state=active]:shadow-md text-[#db7093] text-sm font-semibold transition-all">
            <Calculator className="w-4 h-4 mr-2" />
            Precios 🎀
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="space-y-8 mt-0 focus-visible:outline-none">
          {/* Input Section */}
          <div className="space-y-2">
            <Label htmlFor="base-price" className="text-lg text-[#d87093] font-semibold pl-2">Precio Base (Neto)</Label>
            <Input
              id="base-price"
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={basePriceStr}
              onChange={(e) => setBasePriceStr(e.target.value)}
              placeholder="0"
              className="text-5xl h-20 text-center font-bold text-[#c71585] bg-white/70 backdrop-blur-md border-[#ffb6c1] shadow-[inset_0_2px_10px_rgba(255,182,193,0.2)] rounded-3xl focus-visible:ring-[#ff69b4]/50 transition-all"
            />
          </div>

          {/* Payment Methods Grid */}
          <div className="space-y-3">
            {[
              ["efectivo", "transferencia"],
              ["cuenta_corriente"],
              ["mp_debito", "cuota_3"],
              ["mp_credito", "cuota_6"]
            ].map((row, rowIndex) => {
              const isSelectedRow = row.includes(selectedMethod);
              
              return (
                <div key={rowIndex} className="space-y-3">
                  <div className={`grid gap-3 ${row.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {row.map(methodId => {
                      const method = PAYMENT_METHODS.find(m => m.id === methodId)!;
                      const isSelected = selectedMethod === method.id;
                      
                      let groupStyles = "";
                      if (method.group === "green") {
                        groupStyles = isSelected 
                          ? "bg-[#ffb6c1] text-white border-[#ffb6c1] shadow-[0_4px_20px_-4px_rgba(255,182,193,0.6)]" 
                          : "bg-white text-[#ff69b4] border-[#ffb6c1]/60 hover:bg-[#fff0f5]";
                      } else if (method.group === "orange") {
                        groupStyles = isSelected 
                          ? "bg-[#ff99cc] text-white border-[#ff99cc] shadow-[0_4px_20px_-4px_rgba(255,153,204,0.6)]" 
                          : "bg-[#fff0f5] text-[#ff1493] border-[#ffb6c1]/60 hover:bg-[#ffe4e1]";
                      } else if (method.group === "red") {
                        groupStyles = isSelected 
                          ? "bg-[#ff69b4] text-white border-[#ff69b4] shadow-[0_4px_20px_-4px_rgba(255,105,180,0.6)]" 
                          : "bg-[#ffe4e1] text-[#c71585] border-[#ff99cc]/60 hover:bg-[#ffb6c1]/40";
                      } else if (method.group === "blue") {
                        groupStyles = isSelected 
                          ? "bg-[#dda0dd] text-white border-[#dda0dd] shadow-[0_4px_20px_-4px_rgba(221,160,221,0.6)]" 
                          : "bg-[#f8f8ff] text-[#ba55d3] border-[#dda0dd]/60 hover:bg-[#e6e6fa]";
                      }

                      return (
                        <Button
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id as PaymentMethodId)}
                          variant="outline"
                          className={`h-24 text-lg font-medium whitespace-normal leading-tight rounded-2xl transition-all duration-300 border ${groupStyles} backdrop-blur-sm ${method.id === "cuenta_corriente" ? "h-16" : ""}`}
                        >
                          {method.label}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Render Output if this is the selected row */}
                  {isSelectedRow && (
                    <div className="pt-2 pb-2 animate-in slide-in-from-top-2 fade-in duration-300 space-y-4">
                      {/* Extra Input for Cuenta Corriente */}
                      {selectedMethod === "cuenta_corriente" && (
                        <div className="space-y-2">
                          <Label htmlFor="cc-interest" className="text-sm text-[#db7093] font-semibold pl-2">Interés aplicado (%)</Label>
                          <div className="relative">
                            <Input
                              id="cc-interest"
                              type="number"
                              inputMode="numeric"
                              value={ccInterestStr}
                              onChange={(e) => setCcInterestStr(e.target.value)}
                              className="text-2xl h-14 pl-4 pr-12 font-bold text-[#9370db] bg-white/80 border-[#dda0dd] rounded-2xl focus-visible:ring-[#dda0dd]/50"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#dda0dd] font-bold text-xl">%</span>
                          </div>
                        </div>
                      )}

                      {/* Output Section */}
                      <Card className="bg-white/80 backdrop-blur-xl border-[#ffb6c1]/50 shadow-2xl shadow-[#ffb6c1]/30 rounded-[2rem] overflow-hidden">
                        <CardContent className="p-6 space-y-4 text-center">
                          <div>
                            <p className="text-sm uppercase tracking-wider text-[#db7093] font-bold mb-1">Precio a Cobrar</p>
                            <p className="text-6xl font-black text-[#c71585] tracking-tight drop-shadow-sm">
                              {formatCurrency(finalPrice)}
                            </p>
                          </div>
                          
                          {installment !== null && (
                            <div className="pt-2">
                              <p className="text-sm uppercase tracking-wider text-[#dda0dd] font-bold mb-1">Valor de la Cuota</p>
                              <p className="text-3xl font-bold text-[#ba55d3]">
                                {formatCurrency(installment)}
                              </p>
                            </div>
                          )}

                          <div className="pt-4 border-t border-[#ffb6c1]/40">
                            <p className="text-sm text-[#db7093] font-semibold flex items-center justify-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff69b4]"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                              Neto a Recibir: <span className="font-bold text-[#c71585]">{formatCurrency(netReceived)}</span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6 mt-0 focus-visible:outline-none">
          <Card className="bg-white/80 backdrop-blur-xl border-[#ffb6c1]/50 shadow-2xl shadow-[#ffb6c1]/30 rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="cost-price" className="text-sm text-[#db7093] font-bold uppercase tracking-wider pl-2">Costo del Producto</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ffb6c1] font-bold text-2xl">$</span>
                  <Input
                    id="cost-price"
                    ref={costInputRef}
                    type="number"
                    inputMode="numeric"
                    value={costStr}
                    onChange={(e) => setCostStr(e.target.value)}
                    placeholder="0"
                    className="text-4xl h-16 pl-10 font-bold text-[#c71585] bg-white/90 border-[#ffb6c1] rounded-2xl focus-visible:ring-[#ff69b4]/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="markup" className="text-sm text-[#db7093] font-bold uppercase tracking-wider pl-2">Margen de Ganancia (Remarque)</Label>
                <div className="relative">
                  <Input
                    id="markup"
                    type="number"
                    inputMode="numeric"
                    value={markupStr}
                    onChange={(e) => setMarkupStr(e.target.value)}
                    className="text-3xl h-14 pl-4 pr-12 font-bold text-[#c71585] bg-white/90 border-[#ffb6c1] rounded-2xl focus-visible:ring-[#ff69b4]/50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ffb6c1] font-bold text-xl">%</span>
                </div>
              </div>

              <div className="pt-6 border-t border-[#ffb6c1]/40 text-center space-y-2">
                <p className="text-sm uppercase tracking-wider text-[#db7093] font-bold">Precio Sugerido (Efectivo)</p>
                <p className="text-5xl font-black text-[#ff69b4] tracking-tight drop-shadow-sm">
                  {formatCurrency(suggestedPrice)}
                </p>
                <p className="text-sm text-[#db7093] font-medium pt-1">
                  Ganancia neta: {formatCurrency(suggestedPrice - cost)} 💅
                </p>
              </div>

              <Button 
                onClick={handleSendToPos}
                disabled={suggestedPrice <= 0}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#ff99cc] to-[#ff69b4] hover:opacity-90 text-white shadow-lg shadow-[#ff99cc]/50 transition-all disabled:opacity-50 border-0"
              >
                Usar en Calculadora ✨
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
