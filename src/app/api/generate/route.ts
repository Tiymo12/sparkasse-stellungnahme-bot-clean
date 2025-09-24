import { NextResponse } from "next/server";

type Borrower = {
  id: string;
  name: string;
  family: string;
  housing: string;
  jobEmployer: string;
  employedSince: string;
  netIncome: string;
  otherIncomeDesc?: string;
  otherIncomeAmount?: string;
  customerSince: string;
  mainBank: string;
  accountBehavior: string;
  currentAddress?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { finType, borrowers, globalData, scoring, risk, securities, ksv } = body;

    const borrowersBlock = (borrowers as Borrower[]).map((b, idx) => {
      const addInc =
        b.otherIncomeDesc && b.otherIncomeAmount
          ? `Weitere Einkünfte: ${b.otherIncomeDesc} i.H.v. EUR ${b.otherIncomeAmount} mtl.`
          : `Weitere Einkünfte: keine/ohne Relevanz`;

      return `
Kreditnehmer ${idx + 1}: ${b.name}
Familienstand/Kinder: ${b.family}
Wohnsituation: ${b.housing}
Adresse: ${b.currentAddress || "-"}
Beruf & Arbeitgeber: ${b.jobEmployer}, beschäftigt seit ${b.employedSince}
Nettoeinkommen: EUR ${b.netIncome} mtl.
${addInc}
Seit wann Kunde: ${b.customerSince}
Hauptbank: ${b.mainBank}
Kontoverhalten: ${b.accountBehavior}
      `;
    }).join("\n");

    const text = `
=== Stellungnahme ===

Finanzierungsart: ${finType}

${borrowersBlock}

Bearbeiter: ${globalData?.bearbeiter}
Bewilligungsgrund: ${globalData?.bewilligung}

KSV-Einträge: ${ksv?.count}
Risiken: HHR=${risk.hh}, UKV=${risk.ukv}
Sicherheiten: ${securities || "keine"}

Kennzahlen:
BELQ=${scoring.belq}%, DSTI=${scoring.dsti}%, LTV=${scoring.ltv}%, EIFA=${scoring.eifa}%

Besondere Gründe: ${scoring.reasons}
    `;

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
