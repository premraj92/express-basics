#!/usr/bin/env node
/**
 * EPF/EPS Calculator – Quick Projection
 *
 * Computes EPF future value with monthly contributions and annual interest.
 * Estimates EPS monthly pension (simplified) based on service and wage cap.
 *
 * Usage examples:
 *  node epf_eps_calculator.js --pfWage 40000 --employeePct 12 --vpfPct 0 --years 20 --openingEPF 0 --annualRate 8.25 --serviceYears 20 --pensionableSalary 15000
 *  node epf_eps_calculator.js --pfWage 25000 --employeePct 12 --vpfPct 10 --years 30 --openingEPF 200000 --annualRate 8.1 --serviceYears 28 --pensionableSalary 15000
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = args[i + 1];
      if (val && !val.startsWith('--')) {
        out[key] = isNaN(Number(val)) ? val : Number(val);
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

function monthlyRate(annualRate) {
  return annualRate / 100 / 12;
}

function computeEPFProjection({
  pfWage = 40000, // PF wage (Basic + DA)
  employeePct = 12, // Employee EPF %
  vpfPct = 0, // Voluntary PF % (additional)
  years = 20,
  openingEPF = 0,
  annualRate = 8.25, // EPF declared rate (approx)
}) {
  const mRate = monthlyRate(annualRate);
  const months = Math.round(years * 12);

  // Employer split: 8.33% to EPS capped at ₹15,000 wage → max 1250/month
  const employerPct = 12;
  const epsPct = 8.33;
  const epsCapWage = 15000;

  const employeeEPFMonthly = (employeePct / 100) * pfWage;
  const vpfMonthly = (vpfPct / 100) * pfWage;

  // Employer EPS portion
  const employerEPSMonthly = (epsPct / 100) * Math.min(pfWage, epsCapWage);
  // Employer total EPF portion
  const employerEPFMonthly = (employerPct / 100) * pfWage - employerEPSMonthly;

  let balance = openingEPF;
  let totalEmployeeContrib = 0;
  let totalEmployerEPFContrib = 0;
  let totalInterest = 0;

  for (let m = 1; m <= months; m++) {
    const contrib = employeeEPFMonthly + vpfMonthly + employerEPFMonthly;
    balance += contrib;
    totalEmployeeContrib += employeeEPFMonthly + vpfMonthly;
    totalEmployerEPFContrib += employerEPFMonthly;
    const interest = balance * mRate; // simple monthly compounding on running balance
    balance += interest;
    totalInterest += interest;
  }

  return {
    finalBalance: Math.round(balance),
    totalEmployeeContrib: Math.round(totalEmployeeContrib),
    totalEmployerEPFContrib: Math.round(totalEmployerEPFContrib),
    monthlyContribBreakdown: {
      employeeEPFMonthly: Math.round(employeeEPFMonthly),
      vpfMonthly: Math.round(vpfMonthly),
      employerEPFMonthly: Math.round(employerEPFMonthly),
      employerEPSMonthly: Math.round(employerEPSMonthly),
    },
    annualRate,
    months,
    totalInterest: Math.round(totalInterest),
  };
}

function estimateEPSPension({ pensionableSalary = 15000, serviceYears = 20 }) {
  // Simplified formula: (Pensionable salary × Pensionable service) / 70
  const monthlyPension = (pensionableSalary * serviceYears) / 70;
  return {
    monthlyPension: Math.round(monthlyPension),
    pensionableSalary,
    serviceYears,
    note:
      'Simplified EPS estimate. Actual benefits depend on official calculation, options, caps and notifications.',
  };
}

function main() {
  const args = parseArgs();
  const epf = computeEPFProjection({
    pfWage: args.pfWage ?? 40000,
    employeePct: args.employeePct ?? 12,
    vpfPct: args.vpfPct ?? 0,
    years: args.years ?? 20,
    openingEPF: args.openingEPF ?? 0,
    annualRate: args.annualRate ?? 8.25,
  });
  const eps = estimateEPSPension({
    pensionableSalary: args.pensionableSalary ?? 15000,
    serviceYears: args.serviceYears ?? args.years ?? 20,
  });

  const result = {
    inputs: args,
    epf,
    eps,
    notes: [
      'Employer EPS contribution capped at ₹1,250/month at ₹15,000 wage, excess goes to EPF.',
      'EPF interest credited annually but computed on running monthly balances.',
      'VPF raises employee contribution; tax rules may render interest on annual employee contributions >₹2.5L as taxable.',
    ],
  };

  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main();
}
