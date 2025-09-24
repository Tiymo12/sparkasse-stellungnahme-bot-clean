"use client";

import { useState } from "react";

export default function Home() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult("");

    try {
      const formData = new FormData(e.currentTarget);
      const payload = Object.fromEntries(formData.entries());

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      setResult(data.text || "Keine Stellungnahme erhalten.");
    } catch (err: any) {
      setResult("Fehler: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-sky-700 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );

  const Input = ({ label, name, type = "text", placeholder = "" }: any) => (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300"
      />
    </label>
  );

  const Textarea = ({ label, name, placeholder = "" }: any) => (
    <label className="flex flex-col gap-1 md:col-span-2">
      <span className="text-sm text-gray-600">{label}</span>
      <textarea
        name={name}
        placeholder={placeholder}
        className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300 min-h-[90px]"
      />
    </label>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-red-700">
            Sparkasse Stellungnahme-Bot
          </h1>
          <p className="text-gray-600">
            Automatisierte Stellungnahmen für Wohnbaufinanzierungen &
            Konsumkredite.
          </p>
        </header>

        <form onSubmit={handleGenerate}>
          {/* Step 0: Finanzierungsart */}
          {step === 0 && (
            <Section title="1) Finanzierungsart">
              <Input label="Art der Finanzierung" name="finType" placeholder="Wohnbaufinanzierung oder Konsumkredit" />
              <div className="md:col-span-2 flex justify-end mt-2">
                <button
                  type="button"
                  className="px-5 py-2 rounded bg-green-600 text-white"
                  onClick={() => setStep(1)}
                >
                  Weiter
                </button>
              </div>
            </Section>
          )}

          {/* Step 1: Kreditnehmer */}
          {step === 1 && (
            <Section title="2) Kreditnehmer">
              <Input label="Anzahl Kreditnehmer" name="borrowerCount" type="number" />
              <div className="md:col-span-2 flex justify-between mt-2">
                <button type="button" className="px-5 py-2 rounded bg-gray-200" onClick={() => setStep(0)}>Zurück</button>
                <button type="button" className="px-5 py-2 rounded bg-green-600 text-white" onClick={() => setStep(2)}>Weiter</button>
              </div>
            </Section>
          )}

          {/* Step 2: Kreditnehmerdetails */}
          {step === 2 && (
            <Section title="3) Kunden- und Geschäftsbeziehung">
              <Input label="Name" name="name" />
              <Input label="Familienstand & Kinder" name="family" placeholder="z. B. verheiratet, 2 Kinder" />
              <Input label="Wohnsituation" name="housing" placeholder="z. B. Mieter, Eigentum" />
              <Input label="Aktuelle Adresse" name="address" placeholder="Straße, PLZ Ort" />
              <Input label="Beruf & Arbeitgeber" name="jobEmployer" />
              <Input label="Beschäftigt seit" name="employedSince" type="date" />
              <Input label="Monatliches Nettoeinkommen (€)" name="netIncome" type="number" />
              <Input label="Weitere Einkünfte (Art)" name="otherIncomeDesc" placeholder="z. B. Mieteinnahmen" />
              <Input label="Weitere Einkünfte (EUR)" name="otherIncomeAmount" type="number" />
              <Input label="Seit wann Kunde" name="customerSince" type="date" />
              <Input label="Hauptbank" name="mainBank" />
              <Input label="Kontoverhalten" name="accountBehavior" placeholder="äußerst positiv, positiv, ..." />
              <div className="md:col-span-2 flex justify-between mt-2">
                <button type="button" className="px-5 py-2 rounded bg-gray-200" onClick={() => setStep(1)}>Zurück</button>
                <button type="button" className="px-5 py-2 rounded bg-green-600 text-white" onClick={() => setStep(3)}>Weiter</button>
              </div>
            </Section>
          )}

          {/* Step 3: Finanzierung */}
          {step === 3 && (
            <Section title="4) Finanzierung">
              <Input label="Kaufpreis (TEUR)" name="kaufpreisTEUR" type="number" />
              <Input label="Nebenkosten (TEUR)" name="nebenkostenTEUR" type="number" />
              <Input label="Eigenmittel (TEUR)" name="ekTEUR" type="number" />
              <Input label="Kreditbetrag (TEUR)" name="kreditbetragTEUR" type="number" />
              <Input label="Fixzinssatz (%)" name="fixzinsProzent" type="text" placeholder="z. B. 3,25" />
              <Input label="Fixzins-Bindung (Jahre)" name="fixzinsJahre" type="number" />
              <Input label="Variable Verzinsung" name="variabelText" placeholder="z. B. 2,25% über 6M-Euribor" />
              <Textarea label="Sondertilgungen erlaubt?" name="sondertilgungErlaubt" placeholder="Ja / Nein" />
              <div className="md:col-span-2 flex justify-between mt-2">
                <button type="button" className="px-5 py-2 rounded bg-gray-200" onClick={() => setStep(2)}>Zurück</button>
                <button type="button" className="px-5 py-2 rounded bg-green-600 text-white" onClick={() => setStep(4)}>Weiter</button>
              </div>
            </Section>
          )}

          {/* Step 4: KSV / CRIF / Sicherheiten */}
          {step === 4 && (
            <>
              <Section title="5) Haushalt & Auskünfte">
                <Input label="Haushaltsrechnung (HHR)" name="hh" />
                <Input label="UKV" name="ukv" />
                <Input label="CRIF-Einträge" name="crif" placeholder="Ja / Nein + Begründung" />
                <Input label="Anzahl KSV-Einträge" name="ksvCount" type="number" />
              </Section>
              <Section title="6) Sicherheiten">
                <Textarea label="Sicherheiten" name="securities" placeholder="z. B. Hypothek, Bürgen" />
                <div className="md:col-span-2 flex justify-between mt-2">
                  <button type="button" className="px-5 py-2 rounded bg-gray-200" onClick={() => setStep(3)}>Zurück</button>
                  <button type="button" className="px-5 py-2 rounded bg-green-600 text-white" onClick={() => setStep(5)}>Weiter</button>
                </div>
              </Section>
            </>
          )}

          {/* Step 5: Kennzahlen */}
          {step === 5 && (
            <Section title="7) Kennzahlen & Gründe">
              <Input label="BELQ (%)" name="belq" type="text" />
              <Input label="DSTI (%)" name="dsti" type="text" />
              <Input label="LTV (%)" name="ltv" type="text" />
              <Input label="EIFA (%)" name="eifa" type="text" />
              <Textarea
                label="Besondere Gründe"
                name="reasons"
                placeholder="z. B. Leistbarkeit gegeben, positives Kontogebaren, Vereinbarungen eingehalten..."
              />
              <div className="md:col-span-2 flex justify-between mt-2">
                <button type="button" className="px-5 py-2 rounded bg-gray-200" onClick={() => setStep(4)}>Zurück</button>
                <button type="submit" className="px-5 py-2 rounded bg-green-600 text-white" disabled={loading}>
                  {loading ? "Generiere Stellungnahme…" : "Stellungnahme generieren"}
                </button>
              </div>
            </Section>
          )}
        </form>

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
