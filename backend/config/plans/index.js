import free from "./free.js";
import student_basic from "./student_basic.js";
import student_pro from "./student_pro.js";
import lawyer_starter from "./lawyer_starter.js";
import lawyer_growth from "./lawyer_growth.js";
import office_master from "./office_master.js";
import enterprise from "./enterprise.js";

const plans = {
  // Legacy
  comum: free,
  advogado: lawyer_starter,
  escritorio: office_master,

  // New Plans (Landing Page Mappings)
  free: free,
  student_basic: student_basic,
  student_pro: student_pro,
  lawyer_starter: lawyer_starter,
  lawyer_growth: lawyer_growth,
  office_master: office_master,
  enterprise: enterprise,
};

export default function getPlanConfig(userType) {
  return plans[userType] || free; // Fallback para free
}
