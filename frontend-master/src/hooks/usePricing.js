/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from "axios";

// Default prices — used as fallback when API is unavailable
export const DEFAULT_PRICES = {
  student_basic: "19.90",
  student_pro: "29.90",
  student_master: "59.90",
  lawyer_starter: "127.00",
  lawyer_growth: "147.00",
  office_master: "497.00",
};

/**
 * Hook that fetches plan prices from the API.
 * Falls back to DEFAULT_PRICES if the API is unavailable.
 * @returns {{ prices: Object, loading: boolean }}
 */
const usePricing = () => {
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [planTexts, setPlanTexts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricesAndTexts = async () => {
      try {
        const [pricesRes, textsRes] = await Promise.all([
          axios.get("/api/public/prices"),
          axios.get("/api/public/plans-config").catch(() => ({ data: {} })),
        ]);
        if (pricesRes.data && typeof pricesRes.data === "object") {
          setPrices({ ...DEFAULT_PRICES, ...pricesRes.data });
        }
        if (textsRes.data && typeof textsRes.data === "object") {
          setPlanTexts(textsRes.data);
        }
      } catch (err) {
        console.warn("usePricing: Usando preços padrão (fallback).");
        // Mantém DEFAULT_PRICES
      } finally {
        setLoading(false);
      }
    };

    fetchPricesAndTexts();
  }, []);

  /**
   * Formats a price string to "R$ X.XXX,XX" format.
   * @param {string|number} planId - ID of the plan
   * @returns {string}
   */
  const formatPrice = (planId) => {
    const raw = prices[planId] || "0";
    const num = parseFloat(raw);
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return { prices, planTexts, loading, formatPrice };
};

export default usePricing;
