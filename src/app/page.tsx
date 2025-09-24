"use client";

import { useMemo, useState } from "react";

type FinType = "Wohnbaufinanzierung" | "Konsumkredit";

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
  currentAddress: string;
};

type KsvEntry = {
  id: string;
  kind: string;
  amountTEUR: string;
  firstPayment: string;
  termMonths: string;
  borrower: string;
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [finType, setFinType] = useState<FinType | "">("");
  const [borrowerCount, setBorrowerCount] = useState<number>(1);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [globalData, setGlobalData] = useState<any>({
    adresse: "",
    kaufpreisTEUR: "",
    nebenkostenTEUR: "",
    sanierungTEUR: "",
    puTEUR: "",
    ekTEUR: "",
    fixzinsProzent: "",
    fixzinsJahre: "",
    fixzinsEnde: "",
    variabelText: "",
    sondertilgungErlaubt: "Nein",
    antragszweck: "",
    kreditbetragTEUR: "",
    bearbeiter: "",
    bewilligung: "",
  });

  const [risk, setRisk] = useState<any>({
    hh: "",
    ukv: "",
    crif: { has: false, reason: "" },
    forbearanceText: "",
  });

  const [ksv, setKsv] = useState<{ count: number; entries: KsvEntry[] }>({
    count: 0,
    entries: [],
  });

  const [securities, setSecurities] = useState<string>("");
  const [scoring, setScoring] = useState<any>({
    belq: "",
    dsti: "",
    ltv: "",
    eifa: "",
    reasons: "",
  });

  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const kontoverhaltenOptions = [
    "äußerst positiv",
    "positiv",
    "durchwachsen",
    "häufige Überziehungen",
  ];

  const newId = () => Math.random().toString(36).slice(2, 10);

  const ensureBorrowerSlots = (count: number) => {
    setBorrowers((prev) => {
      const arr = [...prev];
      while (arr.length < count) {
        arr.push({
          id: newId(),
          name: "",
          family: "",
          housing: "",
          jobEmployer: "",
          employedSince: "",
          netIncome: "",
          otherIncomeDesc: "",
          otherIncomeAmount: "",
          customerSince: "",
          mainBank: "",
          accountBehavior: "",
          currentAddress: "",
        });
      }
      return arr.slice(0, count);
    });
  };

  const handleBorrowerChange = (id: string, field: keyof Borrower, value: string) => {
    setBorrowers((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const borrowerNames = useMemo(
    () => borrowers.map((b) => b.name).filter(Boolean),
    [borrowers]
  );

  const handleKsvCountChange = (countStr: string) => {
    const num = Number(countStr || 0);
    const sanitized = Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
    setKsv((prev) => {
      const entries = [...prev.entries];
      while (entries.length < sanitized) {
        entries.push({
          id: newId(),
          kind: "",
          amountTEUR: "",
          firstPayment: "",
          termMonths: "",
          borrower: "",
        });
      }
      return { count: sanitized, entries: entries.slice(0, sanitized) };
    });
  };

  const handleKsvEntryChange = (
    entryId: string,
    field: keyof KsvEntry,
    value: string
  ) => {
    setKsv((prev) => ({
      ...prev,
      entries: prev.entries.map((e) =>
        e.id === entryId ? { ...e, [field]: value } : e
      ),
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult("");
    try {
      const scoringPayload: any = { ...scoring };
      borrowers.forEach((b, i) => {
        const idx = i + 1;
        scoringPayload[`rating_${idx}`] = scoring[`rating_${idx}`] || "";
        scoringPayload[`kbs_${idx}`] = scoring[`kbs_${idx}`] || "";
      });

      const payload = {
        finType: finType as FinType,
        borrowers,
        globalData,
        scoring: scoringPayload,
        risk,
        securities,
        ksv,
      };

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await resp.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server lieferte kein JSON:\n" + text);
      }

      if (!resp.ok && data?.error) {
        throw new Error(data.error);
      }
      setResult(data.text || "Kein Text erhalten.");
    } catch (e: any) {
      setResult("Fehler: " + (e.message || e.toString()));
    } finally {
      setLoading(false);
    }
  };

  const Section: React.FC<{ title: string; children: any }> = ({ title, children }) => (
    <section className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-sky-700 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-red-700">Sparkasse Stellungnahme-Bot</h1>
          <p className="text-gray-600">
            Automatisierte, formelle Stellungnahmen für Wohnbaufinanzierungen und Konsumkredite.
          </p>
        </header>

        {/* Step 0: Finanzierungsart */}
        {step === 0 && (
          <Section title="1) Finanzierungsart">
            <div className="md:col-span-2 flex gap-3">
              <button
                className={`px-4 py-2 rounded ${finType === "Wohnbaufinanzierung" ? "bg-sky-700 text-white" : "bg-gray-200"}`}
                onClick={() => setFinType("Wohnbaufinanzierung")}
              >
                Wohnbaufinanzierung
              </button>
              <button
                className={`px-4 py-2 rounded ${finType === "Konsumkredit" ? "bg-orange-600 text-white" : "bg-gray-200"}`}
                onClick={() => setFinType("Konsumkredit")}
              >
                Konsumkredit
              </button>
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button
                className="px-5 py-2 rounded bg-green-600 text-white disabled:opacity-50"
                disabled={!finType}
                onClick={() => setStep(1)}
              >
                Weiter
              </button>
            </div>
          </Section>
        )}

        {/* Step 1: Kreditnehmeranzahl */}
        {step === 1 && (
          <Section title="2) Anzahl Kreditnehmer">
            <input
              type="number"
              min={1}
              max={4}
              value={borrowerCount}
              onChange={(e) => {
                const n = Math.max(1, Math.min(4, parseInt(e.target.value || "1", 10)));
                setBorrowerCount(n);
                ensureBorrowerSlots(n);
              }}
              className="border rounded px-3 py-2"
            />
            <div className="md:col-span-2 flex justify-between mt-2">
              <button className="px-5 py-2 rounded bg-gray-200" onClick={() => setStep(0)}>Zurück</button>
              <button className="px-5 py-2 rounded bg-green-600 text-white" onClick={() => { ensureBorrowerSlots(borrowerCount); setStep(2); }}>Weiter</button>
            </div>
          </Section>
        )}

        {/* Step 2: Kreditnehmerdetails */}
        {step === 2 && (
          <Section title="3) Kunden- und Geschäftsbeziehung">
            {borrowers.map((b, idx) => (
              <div key={b.id} className="md:col-span-2 border rounded-lg p-4 mb-2">
                <h3 className="font-semibold text-sky-700 mb-2">Kreditnehmer {idx + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Name" value={b.name} onChange={(e) => handleBorrowerChange(b.id, "name", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="text" placeholder="Familienstand & Kinder" value={b.family} onChange={(e) => handleBorrowerChange(b.id, "family", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="text" placeholder="Wohnsituation (z. B. Mieter, Eigentumswohnung)" value={b.housing} onChange={(e) => handleBorrowerChange(b.id, "housing", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="text" placeholder="Aktuelle Adresse" value={b.currentAddress} onChange={(e) => handleBorrowerChange(b.id, "currentAddress", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="text" placeholder="Beruf & Arbeitgeber" value={b.jobEmployer} onChange={(e) => handleBorrowerChange(b.id, "jobEmployer", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="date" value={b.employedSince} onChange={(e) => handleBorrowerChange(b.id, "employedSince", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="number" step="0.01" placeholder="Nettoeinkommen (EUR)" value={b.netIncome} onChange={(e) => handleBorrowerChange(b.id, "netIncome", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="text" placeholder="Weitere Einkünfte (Art)" value={b.otherIncomeDesc} onChange={(e) => handleBorrowerChange(b.id, "otherIncomeDesc", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="number" step="0.01" placeholder="Weitere Einkünfte (EUR/Monat)" value={b.otherIncomeAmount} onChange={(e) => handleBorrowerChange(b.id, "otherIncomeAmount", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="date" value={b.customerSince} onChange={(e) => handleBorrowerChange(b.id, "customerSince", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="text" placeholder="Hauptbank" value={b.mainBank} onChange={(e) => handleBorrowerChange(b.id, "mainBank", e.target.value)} className="border rounded px-3 py-2" />
                  <select value={b.accountBehavior} onChange={(e) => handleBorrowerChange(b.id, "accountBehavior", e.target.value)} className="border rounded px-3 py-2">
                    <option value="">— bitte wählen —</option>
                    {kontoverhaltenOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <div className="md:col-span-2 flex justify-between mt-2">
              <button className="px-5 py-2 rounded bg-gray-200" onClick={() => setStep(1)}>Zurück</button>
              <button className="px-5 py-2 rounded bg-green-600 text-white" onClick={() => setStep(3)}>Weiter</button>
            </div>
          </Section>
        )}

        {/* Step 3: Antragszweck & Konditionen */}
        {step === 3 && (
          <Section title="4) Antragszweck & Konditionen">
            <input type="text" placeholder="Bearbeiter" value={globalData.bearbeiter} onChange={(e) => setGlobalData({ ...globalData, bearbeiter: e.target.value })} className="border rounded px-3 py-2" />
            <input type="text" placeholder="Bewilligung – Grund" value={globalData.bewilligung} onChange={(e) => setGlobalData({ ...globalData, bewilligung: e.target.value })} className="border rounded px-3 py-2" />

            {finType === "Wohnbaufinanzierung" ? (
              <>
                <input type="text" placeholder="Adresse der Liegenschaft" value={globalData.adresse} onChange={(e) => setGlobalData({ ...globalData, adresse: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" step="0.01" placeholder="Kaufpreis (TEUR)" value={globalData.kaufpreisTEUR} onChange={(e) => setGlobalData({ ...globalData, kaufpreisTEUR: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" step="0.01" placeholder="Nebenkosten (TEUR)" value={globalData.nebenkostenTEUR} onChange={(e) => setGlobalData({ ...globalData, nebenkostenTEUR: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" step="0.01" placeholder="Sanierungskosten (TEUR)" value={globalData.sanierungTEUR} onChange={(e) => setGlobalData({ ...globalData, sanierungTEUR: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" step="0.01" placeholder="PU inkl. Beglaubigung (TEUR)" value={globalData.puTEUR} onChange={(e) => setGlobalData({ ...globalData, puTEUR: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" step="0.01" placeholder="Eigenmittel (TEUR)" value={globalData.ekTEUR} onChange={(e) => setGlobalData({ ...globalData, ekTEUR: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" step="0.01" placeholder="Fixzinssatz (%)" value={globalData.fixzinsProzent} onChange={(e) => setGlobalData({ ...globalData, fixzinsProzent: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" placeholder="Fixzins-Bindung (Jahre)" value={globalData.fixzinsJahre} onChange={(e) => setGlobalData({ ...globalData, fixzinsJahre: e.target.value })} className="border rounded px-3 py-2" />
                <input type="date" placeholder="Enddatum Fixzins" value={globalData.fixzinsEnde} onChange={(e) => setGlobalData({ ...globalData, fixzinsEnde: e.target.value })} className="border rounded px-3 py-2" />
                <input type="text" placeholder="Variable Verzinsung" value={globalData.variabelText} onChange={(e) => setGlobalData({ ...globalData, variabelText: e.target.value })} className="border rounded px-3 py-2" />
                <select value={globalData.sondertilgungErlaubt} onChange={(e) => setGlobalData({ ...globalData, sondertilgungErlaubt: e.target.value })} className="border rounded px-3 py-2">
                  <option value="Ja">Ja</option>
                  <option value="Nein">Nein</option>
                </select>
              </>
            ) : (
              <>
                <input type="text" placeholder="Antragszweck" value={globalData.antragszweck} onChange={(e) => setGlobalData({ ...globalData, antragszweck: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" step="0.01" placeholder="Kreditbetrag (TEUR)" value={globalData.kreditbetragTEUR} onChange={(e) => setGlobalData({ ...globalData, kreditbetragTEUR: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" step="0.01" placeholder="Eigenmittel (TEUR)" value={globalData.ekTEUR} onChange={(e) => setGlobalData({ ...globalData, ekTEUR: e.target.value })} className="border rounded px-3 py-2" />
              </>
            )}

            <div className="md:col-span-2 flex justify-between mt-2">
              <button className="px-5 py-2 rounded bg-gray-200" onClick={() => setStep(2)}>Zurück</button>
              <button className="px-5 py-2 rounded bg-green-600 text-white" onClick={() => setStep(4)}>Weiter</button>
            </div>
          </Section>
        )}

        {/* Step 4: Haushalt, CRIF, KSV */}
        {step === 4 && (
          <>
            <Section title="5) Haushalt & Auskünfte">
              <input type="text" placeholder="Haushaltsrechnung (HHR)" value={risk.hh} onChange={(e) => setRisk({ ...risk, hh: e.target.value })} className="border rounded px-3 py-2" />
              <input type="text" placeholder="UKV" value={risk.ukv} onChange={(e) => setRisk({ ...risk, ukv: e.target.value })} className="border rounded px-3 py-2" />
              <select value={risk.crif.has ? "ja" : "nein"} onChange={(e) => setRisk({ ...risk, crif: { ...risk.crif, has: e.target.value === "ja" } })} className="border rounded px-3 py-2">
                <option value="nein">CRIF nein</option>
                <option value="ja">CRIF ja</option>
              </select>
              {risk.crif.has && (
                <input type="text" placeholder="CRIF Begründung" value={risk.crif.reason} onChange={(e) => setRisk({ ...risk, crif: { ...risk.crif, reason: e.target.value } })} className="border rounded px-3 py-2" />
              )}
              <input type="number" placeholder="Anzahl KSV-Einträge" value={ksv.count} onChange={(e) => handleKsvCountChange(e.target.value)} className="border rounded px-3 py-2" />
              {ksv.count > 0 && ksv.entries.map((entry, i) => (
                <div key={entry.id} className="md:col-span-2 border rounded p-3">
                  <h4 className="font-semibold">KSV-Eintrag {i + 1}</h4>
                  <input type="text" placeholder="Kreditart" value={entry.kind} onChange={(e) => handleKsvEntryChange(entry.id, "kind", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="number" step="0.01" placeholder="Kreditbetrag (TEUR)" value={entry.amountTEUR} onChange={(e) => handleKsvEntryChange(entry.id, "amountTEUR", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="date" placeholder="Erste Rate" value={entry.firstPayment} onChange={(e) => handleKsvEntryChange(entry.id, "firstPayment", e.target.value)} className="border rounded px-3 py-2" />
                  <input type="number" placeholder="Laufzeit (Monate)" value={entry.termMonths} onChange={(e) => handleKsvEntryChange(entry.id, "termMonths", e.target.value)} className="border rounded px-3 py-2" />
                  <select value={entry.borrower} onChange={(e) => handleKsvEntryChange(entry.id, "borrower", e.target.value)} className="border rounded px-3 py-2">
                    <option value="">— bitte wählen —</option>
                    {borrowerNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    {borrowerNames.length > 1 && <option value="beide">beide</option>}
                  </select>
                </div>
              ))}
            </Section>

            <Section title="6) Forbearance & Sicherheiten">
              <textarea placeholder="Forbearance" value={risk.forbearanceText} onChange={(e) => setRisk({ ...risk, forbearanceText: e.target.value })} className="border rounded px-3 py-2 min-h-[90px]" />
              <textarea placeholder="Sicherheiten" value={securities} onChange={(e) => setSecurities(e.target.value)} className="border rounded px-3 py-2 min-h-[90px]" />
              <div className="md:col-span-2 flex justify-between mt-2">
                <button className="px-5 py-2 rounded bg-gray-200" onClick={() => setStep(3)}>Zurück</button>
                <button className="px-5 py-2 rounded bg-green-600 text-white" onClick={() => setStep(5)}>Weiter</button>
              </div>
            </Section>
          </>
        )}

        {/* Step 5: Kennzahlen */}
        {step === 5 && (
          <Section title="7) Kennzahlen, Ratings & Gründe">
            {borrowers.map((b, idx) => (
              <div key={b.id} className="md:col-span-2 border rounded p-3">
                <h4 className="font-semibold">Kreditnehmer {idx + 1}: {b.name || "(Name fehlt)"}</h4>
                <input type="text" placeholder="Rating" value={scoring[`rating_${idx + 1}`] || ""} onChange={(e) => setScoring({ ...scoring, [`rating_${idx + 1}`]: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" placeholder="KBS nach Finanzierung" value={scoring[`kbs_${idx + 1}`] || ""} onChange={(e) => setScoring({ ...scoring, [`kbs_${idx + 1}`]: e.target.value })} className="border rounded px-3 py-2" />
              </div>
            ))}
            <input type="number" step="0.01" placeholder="BELQ %" value={scoring.belq} onChange={(e) => setScoring({ ...scoring, belq: e.target.value })} className="border rounded px-3 py-2" />
            <input type="number" step="0.01" placeholder="DSTI %" value={scoring.dsti} onChange={(e) => setScoring({ ...scoring, dsti: e.target.value })} className="border rounded px-3 py-2" />
            <input type="number" step="0.01" placeholder="LTV %" value={scoring.ltv} onChange={(e) => setScoring({ ...scoring, ltv: e.target.value })} className="border rounded px-3 py-2" />
            <input type="number" step="0.01" placeholder="EIFA %" value={scoring.eifa} onChange={(e) => setScoring({ ...scoring, eifa: e.target.value })} className="border rounded px-3 py-2" />
            <textarea placeholder="Besondere Gründe (z. B. positive Prognose, treuer Kunde, etc.)" value={scoring.reasons} onChange={(e) => setScoring({ ...scoring, reasons: e.target.value })} className="border rounded px-3 py-2 min-h-[90px]" />
            <div className="md:col-span-2 flex justify-between mt-2">
              <button className="px-5 py-2 rounded bg-gray-200" onClick={() => setStep(4)}>Zurück</button>
              <button className="px-5 py-2 rounded bg-green-600 text-white disabled:opacity-50" onClick={handleGenerate} disabled={loading}>
                {loading ? "Generiere Stellungnahme…" : "Stellungnahme generieren"}
              </button>
            </div>
          </Section>
        )}

        {result && (
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-sky-700 mb-4">Generierte Stellungnahme</h2>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </section>
        )}
      </div>
    </main>
  );
}
