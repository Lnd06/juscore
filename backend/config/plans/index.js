import free from "./free.js";
import starter from "./starter.js";
import pro from "./pro.js";
import student_basic from "./student_basic.js";
import student_pro from "./student_pro.js";
import student_master from "./student_master.js";
import lawyer_starter from "./lawyer_starter.js";
import lawyer_growth from "./lawyer_growth.js";
import office_master from "./office_master.js";
import enterprise from "./enterprise.js";

const plans = {
  // Legacy (backward compat for old DB entries)
  comum: free,
  advogado: lawyer_starter,
  escritorio: office_master,

  // Current Plans
  free: free,
  starter: starter,
  pro: pro,
  student_basic: student_basic,
  student_pro: student_pro,
  student_master: student_master,
  lawyer_starter: lawyer_starter,
  lawyer_growth: lawyer_growth,
  office_master: office_master,
  enterprise: enterprise,
};

export default function getPlanConfig(userType) {
  return plans[userType] || free; // Fallback para free
}
