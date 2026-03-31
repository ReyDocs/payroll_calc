"use strict";

/**
 * Format a number as Philippine Peso.
 * @param   {number} n
 * @returns {string}
 */
function peso(n) {
  return (
    "₱" +
    n.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/**
 * Format a ratio (0–1) as a percentage string.
 * @param   {number} ratio
 * @param   {number} [decimals=1]
 * @returns {string}
 */
function pct(ratio, decimals = 1) {
  return (ratio * 100).toFixed(decimals) + "%";
}

/**
 * Set an element's textContent to a peso-formatted value.
 * @param {string} id
 * @param {number} val
 */
function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = peso(val);
}

/**
 * Set an element's textContent to a percentage string.
 * @param {string} id
 * @param {number} ratio
 */
function setPct(id, ratio) {
  const el = document.getElementById(id);
  if (el) el.textContent = pct(ratio);
}

/**
 * Set an element's textContent to an arbitrary string.
 * @param {string} id
 * @param {string} text
 */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ── DEDUCTION COMPUTATIONS ────────────────────────────────────────────────────

/** GSIS employee share: 9% of monthly salary. */
function computeGSIS(s) {
  return s * 0.09;
}

/** Pag-IBIG employee share: 2% of salary, capped at ₱100. */
function computePagIBIG(s) {
  return Math.min(s * 0.02, 100);
}

/**
 * PhilHealth employee share: 2.5% of the salary base,
 * where the salary base is clamped between ₱10 000 and ₱100 000.
 */
function computePhilHealth(s) {
  return Math.max(10000, Math.min(s, 100000)) * 0.025;
}

/** Taxable portion of bonuses: amount exceeding the ₱90 000 exemption. */
function computeTaxableBonus(totalBonus) {
  return Math.max(0, totalBonus - 90000);
}

/**
 * TRAIN Law (RA 10963) income tax — 2023 rates onward.
 * @param   {number} nti - Net Taxable Income
 * @returns {number} Annual income tax payable
 */
function computeIncomeTax(nti) {
  if (nti <= 250000) return 0;
  if (nti <= 400000) return (nti - 250000) * 0.15;
  if (nti <= 800000) return 22500 + (nti - 400000) * 0.2;
  if (nti <= 2000000) return 102500 + (nti - 800000) * 0.25;
  if (nti <= 8000000) return 402500 + (nti - 2000000) * 0.3;
  return 2202500 + (nti - 8000000) * 0.35;
}

/**
 * Return a human-readable TRAIN Law bracket label.
 * @param   {number} nti - Net Taxable Income
 * @returns {string}
 */
function getTaxBracketLabel(nti) {
  if (nti <= 250000) return "0% — Exempt (≤ ₱250,000)";
  if (nti <= 400000) return "15% bracket  (₱250K – ₱400K)";
  if (nti <= 800000) return "20% bracket  (₱400K – ₱800K)";
  if (nti <= 2000000) return "25% bracket  (₱800K – ₱2M)";
  if (nti <= 8000000) return "30% bracket  (₱2M – ₱8M)";
  return "35% bracket  (above ₱8M)";
}

// ── RESET ─────────────────────────────────────────────────────────────────────

/** Clear all fields and hide results. */
function resetForm() {
  document.getElementById("salary").value = "";
  document.getElementById("error").classList.remove("visible");

  const results = document.getElementById("results");
  results.classList.remove("visible");

  const chips = document.getElementById("chips");
  chips.classList.remove("visible");

  // Reset progress bar
  const fill = document.getElementById("progress-fill");
  if (fill) fill.style.width = "0";

  // Return focus to the input
  document.getElementById("salary").focus();
}

// ── ANIMATION RETRIGGER ───────────────────────────────────────────────────────

/** Force CSS animations to replay by removing then re-adding them. */
function retriggerAnimations() {
  document.querySelectorAll(".anim").forEach((el) => {
    el.style.animation = "none";
    // Trigger reflow to flush the style change before re-enabling
    void el.offsetHeight;
    el.style.animation = "";
  });
}

// ── MAIN COMPUTE ──────────────────────────────────────────────────────────────

/** Read the salary input, run all computations, and populate the UI. */
function compute() {
  const input = parseFloat(document.getElementById("salary").value);
  const errEl = document.getElementById("error");
  const results = document.getElementById("results");
  const chips = document.getElementById("chips");

  // Validation
  if (!input || input <= 0 || isNaN(input)) {
    errEl.classList.add("visible");
    results.classList.remove("visible");
    chips.classList.remove("visible");
    document.getElementById("salary").focus();
    return;
  }
  errEl.classList.remove("visible");

  const salary = input;

  // ── Monthly figures ──────────────────────────────────────────────────────
  const gsis = computeGSIS(salary);
  const pagibig = computePagIBIG(salary);
  const philhealth = computePhilHealth(salary);
  const totalDed = gsis + pagibig + philhealth;
  const takeHome = salary - totalDed;

  // ── Annual figures ───────────────────────────────────────────────────────
  const annualSalary = salary * 12;
  const annualGSIS = gsis * 12;
  const annualPagIBIG = pagibig * 12;
  const annualPhilHealth = philhealth * 12;
  const totalAnnualDed = totalDed * 12;
  const annualTakeHome = takeHome * 12;

  // ── Bonuses ──────────────────────────────────────────────────────────────
  const thirteenthMonth = salary;
  const bonus = salary;
  const totalBonus = thirteenthMonth + bonus;
  const taxableBonus = computeTaxableBonus(totalBonus);

  // ── Income tax ───────────────────────────────────────────────────────────
  const annualTaxableIncome = annualSalary + taxableBonus - totalAnnualDed;
  const incomeTax = computeIncomeTax(annualTaxableIncome);
  const monthlyTax = incomeTax / 12;
  const effectiveTaxRate =
    annualTaxableIncome > 0 ? incomeTax / annualTaxableIncome : 0;

  // ── Populate: Monthly table ───────────────────────────────────────────────
  set("r-salary", salary);
  set("r-gsis", gsis);
  set("r-pagibig", pagibig);
  set("r-philhealth", philhealth);
  set("r-totalded", totalDed);
  set("r-takehome", takeHome);

  setPct("r-gsis-pct", gsis / salary);
  setPct("r-pagibig-pct", pagibig / salary);
  setPct("r-philhealth-pct", philhealth / salary);
  setPct("r-totalded-pct", totalDed / salary);
  setPct("r-takehome-pct", takeHome / salary);

  // ── Populate: Annual table ────────────────────────────────────────────────
  set("r-annualsalary", annualSalary);
  set("r-annualgsis", annualGSIS);
  set("r-annualpagibig", annualPagIBIG);
  set("r-annualphilhealth", annualPhilHealth);
  set("r-annualtotalded", totalAnnualDed);

  // ── Populate: Bonuses table ───────────────────────────────────────────────
  set("r-13th", thirteenthMonth);
  set("r-bonus", bonus);
  set("r-totalbonus", totalBonus);
  set("r-taxablebonus", taxableBonus);

  // ── Populate: Income Tax table ────────────────────────────────────────────
  set("r-ati", annualTaxableIncome);
  setText("r-bracket", getTaxBracketLabel(annualTaxableIncome));
  set("r-incometax", incomeTax);
  set("r-monthly-tax", monthlyTax);

  // ── Populate: Summary chips ───────────────────────────────────────────────
  setText("chip-takehome", peso(takeHome));
  setText("chip-takehome-pct", pct(takeHome / salary) + " of gross salary");
  setText("chip-ati", peso(annualTaxableIncome));
  setText("chip-tax", peso(incomeTax));
  setText("chip-tax-rate", "Effective rate: " + pct(effectiveTaxRate));
  setText("chip-annual-takehome", peso(annualTakeHome));

  // ── Progress bar (deduction share of salary) ──────────────────────────────
  const deductShare = (totalDed / salary) * 100;
  const fill = document.getElementById("progress-fill");
  if (fill) {
    // Reset to 0 first so the CSS transition replays each time
    fill.style.width = "0";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.width = deductShare.toFixed(2) + "%";
      });
    });
  }

  // ── Show results ──────────────────────────────────────────────────────────
  chips.classList.add("visible");
  results.classList.add("visible");

  retriggerAnimations();

  // Smooth-scroll so the chips come into view
  setTimeout(() => {
    chips.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 80);
}

// ── EVENT LISTENERS ───────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const salaryInput = document.getElementById("salary");

  // Enter key triggers compute
  salaryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") compute();
  });

  // Clear the error message as soon as the user starts editing
  salaryInput.addEventListener("input", () => {
    document.getElementById("error").classList.remove("visible");
  });
});
