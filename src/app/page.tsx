"use client";

import { useState, useMemo } from "react";

type FinType = "Wohnbaufinanzierung" | "Konsumkredit";

type Borrower = {
  id: string;
  name: string;
  address: string;
  family: string;
  housing: string;
  jobEmployer: string;
  employedSince: string;
  netIncome: string;
  otherIncomeDesc: string;
  otherIncomeAmount: string;
  customerSince: string;
  mainBank: string;
  accountBehavior: string;
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
  const [borrowerCount, setBorrowerCount] = useState(1);
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

  const [securities, setSecurities] = useState("");
  const [scoring, setScoring] = useState<any>({
    belq: "",
    dsti: "",
    ltv: "",
    eifa: "",
    reasons: "",
  });

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

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
          address: "",
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
        });
      }
      return arr.slice(0, count);
    });
  };

  const handleBorrowerChange = (
    id: string,
    field: keyof Borrower,
    value: string
  ) => {
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

  const Section = ({ title, children }: { title: string; children: any }) => (
    <section className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-sky-700 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-red-700">
            Sparkasse Stellungnahme-Bot
          </h1>
          <p className="text-gray-600">
            Automatisierte, formelle Stellungnahmen für Wohnbaufinanzierungen
            und Konsumkredite.
          </p>
        </header>

        {/* Step 0 */}
        {step === 0 && (
          <Section title="1) Finanzierungsart">
            <button
              className={`px-4 py-2 rounded ${
                finType === "Wohnbaufinanzierung"
                  ? "bg-sky-700 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setFinType("Wohnbaufinanzierung")}
            >
              Wohnbaufinanzierung
            </button>
            <button
              className={`px-4 py-2 rounded ${
                finType === "Konsumkredit"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setFinType("Konsumkredit")}
            >
              Konsumkredit
            </button>
            <button
              className="px-5 py-2 rounded bg-green-600 text-white"
              disabled={!finType}
              onClick={() => setStep(1)}
            >
              Weiter
            </button>
          </Section>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <Section title="2) Kreditnehmer">
            <input
              type="number"
              min={1}
              max={4}
              value={borrowerCount}
              onChange={(e) => {
                const n = Math.max(
                  1,
                  Math.min(4, parseInt(e.target.value || "1", 10))
                );
                setBorrowerCount(n);
                ensureBorrowerSlots(n);
              }}
              className="border rounded px-3 py-2"
            />
            <button onClick={() => setStep(2)} className="px-5 py-2 bg-green-600 text-white">
              Weiter
            </button>
          </Section>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Section title="3) Kunden- und Geschäftsbeziehung">
            {borrowers.map((b, idx) => (
              <div key={b.id} className="border rounded p-3 mb-2">
                <h3 className="font-semibold text-sky-700">Kreditnehmer {idx + 1}</h3>
                <input
                  placeholder="Name"
                  value={b.name}
                  onChange={(e) =>
                    handleBorrowerChange(b.id, "name", e.target.value)
                  }
                  className="border rounded px-3 py-2 w-full mb-2"
                />
                <input
                  placeholder="Aktuelle Adresse"
                  value={b.address}
                  onChange={(e) =>
                    handleBorrowerChange(b.id, "address", e.target.value)
                  }
                  className="border rounded px-3 py-2 w-full mb-2"
                />
                <input
                  placeholder="Familienstand & Kinder"
                  value={b.family}
                  onChange={(e) =>
                    handleBorrowerChange(b.id, "family", e.target.value)
                  }
                  className="border rounded px-3 py-2 w-full mb-2"
                />
                <input
                  placeholder="Wohnsituation (z. B. eigene Wohnung, Mieter, eigenes Haus)"
                  value={b.housing}
                  onChange={(e) =>
                    handleBorrowerChange(b.id, "housing", e.target.value)
                  }
                  className="border rounded px-3 py-2 w-full mb-2"
                />
                <input
                  placeholder="Beruf & Arbeitgeber"
                  value={b.jobEmployer}
                  onChange={(e) =>
                    handleBorrowerChange(b.id, "jobEmployer", e.target.value)
                  }
                  className="border rounded px-3 py-2 w-full mb-2"
                />
              </div>
            ))}
            <button onClick={() => setStep(3)} className="px-5 py-2 bg-green-600 text-white">
              Weiter
            </button>
          </Section>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Section title="4) Antragszweck & Konditionen">
            {finType === "Wohnbaufinanzierung" ? (
              <>
                <input
                  placeholder="Adresse der Liegenschaft"
                  value={globalData.adresse}
                  onChange={(e) =>
                    setGlobalData({ ...globalData, adresse: e.target.value })
                  }
                  className="border rounded px-3 py-2 w-full mb-2"
                />
                <input
                  placeholder="Kaufpreis (TEUR)"
                  type="number"
                  step="0.01"
                  value={globalData.kaufpreisTEUR}
                  onChange={(e) =>
                    setGlobalData({
                      ...globalData,
                      kaufpreisTEUR: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2 w-full mb-2"
                />
              </>
            ) : (
              <>
                <input
                  placeholder="Antragszweck (z. B. Gebrauchtwagen, Möbel …)"
                  value={globalData.antragszweck}
                  onChange={(e) =>
                    setGlobalData({
                      ...globalData,
                      antragszweck: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2 w-full mb-2"
                />
                <input
                  placeholder="Kreditbetrag (TEUR)"
                  type="number"
                  step="0.01"
                  value={globalData.kreditbetragTEUR}
                  onChange={(e) =>
                    setGlobalData({
                      ...globalData,
                      kreditbetragTEUR: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2 w-full mb-2"
                />
              </>
            )}
            <button onClick={() => setStep(4)} className="px-5 py-2 bg-green-600 text-white">
              Weiter
            </button>
          </Section>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <Section title="5) Haushalt, CRIF, KSV, Sicherheiten">
            <input
              placeholder="Haushaltsrechnung (HHR)"
              value={risk.hh}
              onChange={(e) => setRisk({ ...risk, hh: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              placeholder="UKV"
              value={risk.ukv}
              onChange={(e) => setRisk({ ...risk, ukv: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <select
              value={risk.crif.has ? "ja" : "nein"}
              onChange={(e) =>
                setRisk({
                  ...risk,
                  crif: { ...risk.crif, has: e.target.value === "ja" },
                })
              }
              className="border rounded px-3 py-2 w-full mb-2"
            >
              <option value="nein">CRIF-Eintrag: Nein</option>
              <option value="ja">CRIF-Eintrag: Ja</option>
            </select>
            {risk.crif.has && (
              <input
                placeholder="CRIF Begründung"
                value={risk.crif.reason}
                onChange={(e) =>
                  setRisk({
                    ...risk,
                    crif: { ...risk.crif, reason: e.target.value },
                  })
                }
                className="border rounded px-3 py-2 w-full mb-2"
              />
            )}
            <input
              type="number"
              placeholder="Anzahl KSV-Einträge"
              value={ksv.count}
              onChange={(e) => handleKsvCountChange(e.target.value)}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            {ksv.count > 0 &&
              ksv.entries.map((entry, i) => (
                <div key={entry.id} className="border rounded p-3 mb-2">
                  <h4>KSV-Eintrag {i + 1}</h4>
                  <input
                    placeholder="Kreditart"
                    value={entry.kind}
                    onChange={(e) =>
                      handleKsvEntryChange(entry.id, "kind", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full mb-2"
                  />
                </div>
              ))}
            <textarea
              placeholder="Sicherheiten"
              value={securities}
              onChange={(e) => setSecurities(e.target.value)}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <button onClick={() => setStep(5)} className="px-5 py-2 bg-green-600 text-white">
              Weiter
            </button>
          </Section>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <Section title="6) Kennzahlen & Stellungnahme">
            <input
              placeholder="BELQ %"
              value={scoring.belq}
              onChange={(e) => setScoring({ ...scoring, belq: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <textarea
              placeholder="Besondere Gründe für Bewilligung"
              value={scoring.reasons}
              onChange={(e) => setScoring({ ...scoring, reasons: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <button
              className="px-5 py-2 bg-green-600 text-white"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Generiere Stellungnahme…" : "Stellungnahme generieren"}
            </button>
          </Section>
        )}

        {result && (
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-sky-700 mb-4">
              Generierte Stellungnahme
            </h2>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </section>
        )}
      </div>
    </main>
  );
}
