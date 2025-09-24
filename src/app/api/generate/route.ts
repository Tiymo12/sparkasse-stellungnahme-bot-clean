import OpenAI from "openai";
import { NextResponse } from "next/server";

type FinType = "Wohnbaufinanzierung" | "Konsumkredit";

interface Borrower {
  name: string;
  family: string;
  currentAddress?: string;
  housing: string;
  jobEmployer: string;
  employedSince: string;
  netIncome: string;
  otherIncomeDesc?: string;
  otherIncomeAmount?: string;
  customerSince: string;
  mainBank: string;
  accountBehavior: string;
}

interface KsvEntry {
  kind: string;
  amountTEUR: string;
  firstPayment: string;
  termMonths: string;
  borrower: string;
}

interface Risk {
  hh: string;
  ukv: string;
  crif: { has: boolean; reason?: string };
  forbearanceText: string;
}

interface Scoring {
  belq?: string;
  dsti?: string;
  ltv?: string;
  eifa?: string;
  reasons?: string;
  [key: string]: string | undefined;
}

interface GlobalData {
  // allgemein
  bearbeiter?: string;
  bewilligung?: string;
  // wohnbau
  adresse?: string;
  kaufpreisTEUR?: string;
  nebenkostenTEUR?: string;
  sanierungTEUR?: string;
  puTEUR?: string;
  ekTEUR?: string;
  fixzinsProzent?: string;
  fixzinsJahre?: string;
  fixzinsEnde?: string;
  variabelText?: string;
  sondertilgungErlaubt?: string;
  // konsum
  antragszweck?: string;
  kreditbetragTEUR?: string;
}

interface Payload {
  finType: FinType;
  borrowers: Borrower[];
  globalData: GlobalData;
  risk: Risk;
  ksv: { count: number; entries: KsvEntry[] };
  securities: string;
  scoring: Scoring;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const { finType, borrowers, globalData, scoring, risk, securities, ksv } = body;

    const borrowersBlock = borrowers
      .map((b) => {
        const addInc =
          b.otherIncomeDesc && b.otherIncomeAmount
            ? `Weitere Einkünfte: ${b.otherIncomeDesc} i.H.v. EUR ${b.otherIncomeAmount} mtl.`
            : `Weitere Einkünfte: keine/ohne Relevanz`;

        const addr = b.currentAddress ? `Adresse: ${b.currentAddress}. ` : "";

        return `- ${b.name}: ${b.family}. ${addr}Wohnsituation: ${b.housing}. Beruf & Arbeitgeber: ${b.jobEmployer}. Beschäftigt seit ${b.employedSince}, mtl. Nettoeinkommen EUR ${b.netIncome}. ${addInc}. Kunde seit ${b.customerSince}; Hauptbank: ${b.mainBank}; Kontoverhalten: ${b.accountBehavior}.`;
      })
      .join("\n");

    const crifLine = risk.crif.has
      ? `CRIF: ja/wesentlich – ${risk.crif.reason || "Begründung fehlt"}`
      : `CRIF: nein/unwesentlich`;

    const ksvBlock =
      ksv.count === 0
        ? `KSV: 0`
        : ksv.entries
            .map(
              (e, i) =>
                `KSV-Eintrag ${i + 1}: ${e.kind} über ${e.amountTEUR} TEUR, erste Rate ${e.firstPayment}, LZ ${e.termMonths} Mon., KN: ${e.borrower}`
            )
            .join("\n");

    let headerBlock = "";
    let konditionenBlock = "";
    let konsBlock = "";

    if (finType === "Wohnbaufinanzierung") {
      const gp = Number((globalData.kaufpreisTEUR || "0").replace(",", "."));
      const nk = Number((globalData.nebenkostenTEUR || "0").replace(",", "."));
      const san = Number((globalData.sanierungTEUR || "0").replace(",", "."));
      const pu = Number((globalData.puTEUR || "0").replace(",", "."));
      const ek = Number((globalData.ekTEUR || "0").replace(",", "."));
      const gesamt = gp + nk + san + pu;
      const kreditbed = Math.max(0, gesamt - ek);
      const bagEUR = Math.round(kreditbed * 1000 * 0.01);

      headerBlock = `Der Kredit dient zum Erwerb der Liegenschaft in ${globalData.adresse || "—"}.\n\nDie Projektkosten setzen sich zusammen:\n- ${gp} TEUR Kaufpreis\n- ${nk} TEUR Nebenkosten\n- ${san} TEUR Sanierung\n- ${pu} TEUR PU inkl. Beglaubigung\n= ${gesamt} TEUR Gesamtprojekt\n+ ${ek} TEUR Eigenmittel\n= ${kreditbed} TEUR benötigtes Finanzierungsvolumen\n`;

      konditionenBlock = `Folgende Konditionen wurden vereinbart:\n- SZ ${globalData.fixzinsProzent || "—"} % fix ${globalData.fixzinsJahre || "—"} Jahre bis ${
        globalData.fixzinsEnde || "—"
      }, anschließend variabel: ${globalData.variabelText || "—"}\n- BAG ≈ EUR ${bagEUR} / Quartal\n- pönalefreie Sondertilgungen: ${globalData.sondertilgungErlaubt || "Nein"}\n`;
    } else {
      konsBlock = `Der KN benötigt gegenständliche Finanzierung über ${globalData.kreditbetragTEUR || "—"} TEUR für ${
        globalData.antragszweck || "—"
      }. Es werden Eigenmittel von ${globalData.ekTEUR || "—"} TEUR eingebracht.\n`;
    }

    const ratingsLines = borrowers
      .map((b, i) => {
        const r = scoring[`rating_${i + 1}`] || "entfällt";
        const kbs = scoring[`kbs_${i + 1}`] || "";
        return `${b.name || `Kreditnehmer ${i + 1}`}: Rating ${r}${kbs ? ` | KBS: ${kbs}` : ""}`;
      })
      .join("\n");

    const systemPrompt = `
Du bist Kreditsachbearbeiter einer Sparkasse. Schreibe eine formelle Stellungnahme mit den Abschnitten:
1) Antragszweck
2) Person des Kreditnehmers
3) Kunden- und Geschäftsbeziehungen
4) Bilanz / Haushaltsplan
5) Fin. Schwierigkeiten / Forbearance
6) Besicherung
7) Gesamturteil

Nutze den Stil wie in den gelieferten Beispielen (Sparkasse, formal, sauber). Pflicht:
- Satz "weiteres Potential in der Geschäftsverbindung" im Gesamturteil
- "CM2 und CM4 Daten bitte aus BON entnehmen" im Gesamturteil
- Bei Wohnbau: Projektkostenblock & Konditionen wie angegeben.
`;

    const userContent = `
Finanzierungsart: ${finType}

Empfehlung: ${globalData.bearbeiter || "—"}
Bewilligung: ${globalData.bewilligung || "—"}

${finType === "Wohnbaufinanzierung" ? `${headerBlock}\n${konditionenBlock}` : konsBlock}

-- Kreditnehmer --
${borrowersBlock}

-- Haushalt / Auskünfte --
HHR: ${risk.hh}
UKV: ${risk.ukv}
${crifLine}
${ksvBlock}

-- Forbearance --
${risk.forbearanceText || "—"}

-- Sicherheiten --
${securities || "—"}

-- Kennzahlen --
BELQ: ${scoring.belq || "—"}%
DSTI: ${scoring.dsti || "—"}%
LTV: ${scoring.ltv || "—"}%
EIFA: ${scoring.eifa || "—"}%
${ratingsLines}

Besondere Gründe:
${(scoring.reasons || "—").trim()}
`;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    return NextResponse.json({ text: resp.choices[0]?.message?.content ?? "" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
