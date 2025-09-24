"use client";

import { useState, useMemo } from "react";

type FinType = "Wohnbaufinanzierung" | "Konsumkredit";

type Borrower = {
  id: string;
  name: string;
  family: string;
  housing: string;
  address: string;
  jobEmployer: string;
  employedSince: string;
  netIncome: string;
  otherIncomeDesc?: string;
  otherIncomeAmount?: string;
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
          address: "",
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

  // UI-Elemente
  const Section: React.FC<{ title: string; children: any }> = ({
    title,
    children,
  }) => (
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
            Automatisierte, formelle Stellungnahmen für Wohnbaufinanzierungen und Konsumkredite.
          </p>
        </header>

        {/* Step 0 */}
        {step === 0 && (
          <Section title="1) Finanzierungsart">
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
            <div className="md:col-span-2 flex justify-end mt-2">
              <button
                className="px-5 py-2 rounded bg-green-600 text-white"
                disabled={!finType}
                onClick={() => setStep(1)}
              >
                Weiter
              </button>
            </div>
          </Section>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <Section title="2) Kreditnehmer">
            <label>
              Anzahl Kreditnehmer
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
                className="border rounded px-3 py-2 w-full"
              />
            </label>
            <div className="md:col-span-2 flex justify-between mt-2">
              <button onClick={() => setStep(0)} className="px-5 py-2 rounded bg-gray-200">
                Zurück
              </button>
              <button onClick={() => setStep(2)} className="px-5 py-2 rounded bg-green-600 text-white">
                Weiter
              </button>
            </div>
          </Section>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Section title="3) Kunden- und Geschäftsbeziehung">
            {borrowers.map((b, idx) => (
              <div key={b.id} className="md:col-span-2 border rounded p-4 mb-2">
                <h3 className="font-semibold text-sky-700 mb-2">Kreditnehmer {idx + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label>
                    Name
                    <input
                      value={b.name}
                      onChange={(e) => handleBorrowerChange(b.id, "name", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Familienstand & Kinder
                    <input
                      value={b.family}
                      onChange={(e) => handleBorrowerChange(b.id, "family", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Wohnsituation (z. B. Mieter, Eigentum…)
                    <input
                      value={b.housing}
                      onChange={(e) => handleBorrowerChange(b.id, "housing", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Aktuelle Adresse
                    <input
                      value={b.address}
                      onChange={(e) => handleBorrowerChange(b.id, "address", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Beruf & Arbeitgeber
                    <input
                      value={b.jobEmployer}
                      onChange={(e) => handleBorrowerChange(b.id, "jobEmployer", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Beschäftigt seit
                    <input
                      type="date"
                      value={b.employedSince}
                      onChange={(e) => handleBorrowerChange(b.id, "employedSince", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Monatliches Nettoeinkommen
                    <input
                      type="number"
                      step="0.01"
                      value={b.netIncome}
                      onChange={(e) => handleBorrowerChange(b.id, "netIncome", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Weitere Einkünfte (Art)
                    <input
                      value={b.otherIncomeDesc || ""}
                      onChange={(e) => handleBorrowerChange(b.id, "otherIncomeDesc", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Weitere Einkünfte (EUR/Monat)
                    <input
                      type="number"
                      step="0.01"
                      value={b.otherIncomeAmount || ""}
                      onChange={(e) => handleBorrowerChange(b.id, "otherIncomeAmount", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Seit wann Kunde
                    <input
                      type="date"
                      value={b.customerSince}
                      onChange={(e) => handleBorrowerChange(b.id, "customerSince", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Hauptbankverbindung
                    <input
                      value={b.mainBank}
                      onChange={(e) => handleBorrowerChange(b.id, "mainBank", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </label>
                  <label>
                    Kontoverhalten
                    <select
                      value={b.accountBehavior}
                      onChange={(e) => handleBorrowerChange(b.id, "accountBehavior", e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="">— bitte wählen —</option>
                      {kontoverhaltenOptions.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))}
            <div className="md:col-span-2 flex justify-between mt-2">
              <button onClick={() => setStep(1)} className="px-5 py-2 rounded bg-gray-200">Zurück</button>
              <button onClick={() => setStep(3)} className="px-5 py-2 rounded bg-green-600 text-white">Weiter</button>
            </div>
          </Section>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Section title="4) Antragszweck & Konditionen">
            <label>
              Bearbeiter
              <input
                value={globalData.bearbeiter}
                onChange={(e) => setGlobalData({ ...globalData, bearbeiter: e.target.value })}
                className="border rounded px-3 py-2 w-full"
              />
            </label>
            <label>
              Bewilligung – Grund
              <input
                value={globalData.bewilligung}
                onChange={(e) => setGlobalData({ ...globalData, bewilligung: e.target.value })}
                className="border rounded px-3 py-2 w-full"
              />
            </label>

            {finType === "Wohnbaufinanzierung" ? (
              <>
                <label>
                  Kaufpreis (TEUR)
                  <input
                    type="number"
                    step="0.01"
                    value={globalData.kaufpreisTEUR}
                    onChange={(e) => setGlobalData({ ...globalData, kaufpreisTEUR: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
                <label>
                  Nebenkosten (TEUR)
                  <input
                    type="number"
                    step="0.01"
                    value={globalData.nebenkostenTEUR}
                    onChange={(e) => setGlobalData({ ...globalData, nebenkostenTEUR: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
                <label>
                  Sanierungskosten (TEUR)
                  <input
                    type="number"
                    step="0.01"
                    value={globalData.sanierungTEUR}
                    onChange={(e) => setGlobalData({ ...globalData, sanierungTEUR: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
                <label>
                  Eigenmittel (TEUR)
                  <input
                    type="number"
                    step="0.01"
                    value={globalData.ekTEUR}
                    onChange={(e) => setGlobalData({ ...globalData, ekTEUR: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
                <label>
                  Fixzinssatz %
                  <input
                    type="number"
                    step="0.01"
                    value={globalData.fixzinsProzent}
                    onChange={(e) => setGlobalData({ ...globalData, fixzinsProzent: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Antragszweck
                  <input
                    value={globalData.antragszweck}
                    onChange={(e) => setGlobalData({ ...globalData, antragszweck: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
                <label>
                  Kreditbetrag (TEUR)
                  <input
                    type="number"
                    step="0.01"
                    value={globalData.kreditbetragTEUR}
                    onChange={(e) => setGlobalData({ ...globalData, kreditbetragTEUR: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
                <label>
                  Eigenmittel (TEUR)
                  <input
                    type="number"
                    step="0.01"
                    value={globalData.ekTEUR}
                    onChange={(e) => setGlobalData({ ...globalData, ekTEUR: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
              </>
            )}

            <div className="md:col-span-2 flex justify-between mt-2">
              <button onClick={() => setStep(2)} className="px-5 py-2 rounded bg-gray-200">Zurück</button>
              <button onClick={() => setStep(4)} className="px-5 py-2 rounded bg-green-600 text-white">Weiter</button>
            </div>
          </Section>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <>
            <Section title="5) Haushalt & Auskünfte">
              <label>
                Haushaltsrechnung (HHR)
                <input
                  value={risk.hh}
                  onChange={(e) => setRisk({ ...risk, hh: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </label>
              <label>
                UKV
                <input
                  value={risk.ukv}
                  onChange={(e) => setRisk({ ...risk, ukv: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </label>
              <label>
                CRIF-Einträge vorhanden?
                <select
                  value={risk.crif.has ? "ja" : "nein"}
                  onChange={(e) => setRisk({ ...risk, crif: { ...risk.crif, has: e.target.value === "ja" } })}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="nein">nein</option>
                  <option value="ja">ja</option>
                </select>
              </label>
              {risk.crif.has && (
                <label>
                  CRIF-Begründung
                  <input
                    value={risk.crif.reason}
                    onChange={(e) => setRisk({ ...risk, crif: { ...risk.crif, reason: e.target.value } })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
              )}

              <label>
                Anzahl KSV-Einträge
                <input
                  type="number"
                  value={String(ksv.count)}
                  onChange={(e) => handleKsvCountChange(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                />
              </label>
              {ksv.count > 0 &&
                ksv.entries.map((entry, i) => (
                  <div key={entry.id} className="md:col-span-2 border rounded p-3">
                    <h4 className="font-semibold text-gray-700 mb-2">KSV-Eintrag {i + 1}</h4>
                    <label>
                      Kreditart
                      <input
                        value={entry.kind}
                        onChange={(e) => handleKsvEntryChange(entry.id, "kind", e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </label>
                    <label>
                      Kreditbetrag (TEUR)
                      <input
                        type="number"
                        step="0.01"
                        value={entry.amountTEUR}
                        onChange={(e) => handleKsvEntryChange(entry.id, "amountTEUR", e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </label>
                  </div>
                ))}
            </Section>

            <Section title="6) Schwierigkeiten / Sicherheiten">
              <label>
                Forbearance
                <textarea
                  value={risk.forbearanceText}
                  onChange={(e) => setRisk({ ...risk, forbearanceText: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </label>
              <label>
                Sicherheiten
                <textarea
                  value={securities}
                  onChange={(e) => setSecurities(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                />
              </label>
              <div className="md:col-span-2 flex justify-between mt-2">
                <button onClick={() => setStep(3)} className="px-5 py-2 rounded bg-gray-200">Zurück</button>
                <button onClick={() => setStep(5)} className="px-5 py-2 rounded bg-green-600 text-white">Weiter</button>
              </div>
            </Section>
          </>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <Section title="7) Kennzahlen & Gründe">
            {borrowers.map((b, idx) => (
              <div key={b.id} className="md:col-span-2 border rounded p-3">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Kreditnehmer {idx + 1}: {b.name || "(Name fehlt)"}
                </h4>
                <label>
                  Rating
                  <input
                    value={scoring[`rating_${idx + 1}`] || ""}
                    onChange={(e) => setScoring({ ...scoring, [`rating_${idx + 1}`]: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
                <label>
                  KBS nach Finanzierung
                  <input
                    type="number"
                    step="0.01"
                    value={scoring[`kbs_${idx + 1}`] || ""}
                    onChange={(e) => setScoring({ ...scoring, [`kbs_${idx + 1}`]: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </label>
              </div>
            ))}
            <label>
              BELQ %
              <input
                type="number"
                step="0.01"
                value={scoring.belq}
                onChange={(e) => setScoring({ ...scoring, belq: e.target.value })}
                className="border rounded px-3 py-2 w-full"
              />
            </label>
            <label>
              DSTI %
              <input
                type="number"
                step="0.01"
                value={scoring.dsti}
                onChange={(e) => setScoring({ ...scoring, dsti: e.target.value })}
                className="border rounded px-3 py-2 w-full"
              />
            </label>
            <label>
              Gründe
              <textarea
                value={scoring.reasons}
                onChange={(e) => setScoring({ ...scoring, reasons: e.target.value })}
                className="border rounded px-3 py-2 w-full"
              />
            </label>

            <div className="md:col-span-2 flex justify-between mt-2">
              <button onClick={() => setStep(4)} className="px-5 py-2 rounded bg-gray-200">Zurück</button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-5 py-2 rounded bg-green-600 text-white"
              >
                {loading ? "Generiere…" : "Stellungnahme generieren"}
              </button>
            </div>
          </Section>
        )}

        {result && (
          <Section title="Generierte Stellungnahme">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </Section>
        )}
      </div>
    </main>
  );
}
