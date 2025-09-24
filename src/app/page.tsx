"use client";

import { useState } from "react";

export default function Home() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // API-Aufruf
  const handleGenerate = async () => {
    setLoading(true);
    setResult("");
    try {
      const form = document.getElementById("mainForm") as HTMLFormElement;
      const formData = new FormData(form);
      const payload: Record<string, any> = {};
      formData.forEach((val, key) => {
        payload[key] = val;
      });

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      setResult(data.text || "Kein Text erhalten.");
    } catch (e: any) {
      setResult("Fehler: " + e.message);
    } finally {
      setLoading(false);
    }
  };

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

        <form id="mainForm" className="space-y-6">
          {/* Step 0 */}
          {step === 0 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">1) Finanzierungsart</h2>
              <select name="finType" className="border p-2 w-full">
                <option value="">— bitte wählen —</option>
                <option value="Wohnbaufinanzierung">Wohnbaufinanzierung</option>
                <option value="Konsumkredit">Konsumkredit</option>
              </select>
              <div className="flex justify-end mt-3">
                <button type="button" onClick={() => setStep(1)} className="bg-green-600 text-white px-4 py-2 rounded">
                  Weiter
                </button>
              </div>
            </section>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">2) Kreditnehmer</h2>
              <label className="block mb-2">
                <span className="text-sm">Anzahl Kreditnehmer</span>
                <input name="borrowerCount" type="number" min="1" max="4" className="border p-2 w-full" />
              </label>
              <div className="flex justify-between mt-3">
                <button type="button" onClick={() => setStep(0)} className="bg-gray-300 px-4 py-2 rounded">
                  Zurück
                </button>
                <button type="button" onClick={() => setStep(2)} className="bg-green-600 text-white px-4 py-2 rounded">
                  Weiter
                </button>
              </div>
            </section>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">3) Kunden- und Geschäftsbeziehung</h2>
              <label className="block mb-2">
                <span className="text-sm">Name</span>
                <input name="name" type="text" className="border p-2 w-full" placeholder="Max Mustermann" />
              </label>
              <label className="block mb-2">
                <span className="text-sm">Familienstand & Kinder</span>
                <input name="family" type="text" className="border p-2 w-full" placeholder="verheiratet, 2 Kinder" />
              </label>
              <label className="block mb-2">
                <span className="text-sm">Wohnsituation</span>
                <input name="housing" type="text" className="border p-2 w-full" placeholder="Mieter, eigene Wohnung, Haus..." />
              </label>
              <label className="block mb-2">
                <span className="text-sm">Aktuelle Adresse</span>
                <input name="address" type="text" className="border p-2 w-full" placeholder="Musterstraße 1, 1234 Musterstadt" />
              </label>
              <label className="block mb-2">
                <span className="text-sm">Beruf & Arbeitgeber</span>
                <input name="jobEmployer" type="text" className="border p-2 w-full" placeholder="Bankangestellter bei Sparkasse" />
              </label>
              <label className="block mb-2">
                <span className="text-sm">Monatliches Nettoeinkommen</span>
                <input name="netIncome" type="number" step="0.01" className="border p-2 w-full" placeholder="z. B. 2500,00" />
              </label>
              <label className="block mb-2">
                <span className="text-sm">Weitere Einkünfte</span>
                <input name="otherIncome" type="text" className="border p-2 w-full" placeholder="Mieteinnahmen, Familienbeihilfe" />
              </label>
              <div className="flex justify-between mt-3">
                <button type="button" onClick={() => setStep(1)} className="bg-gray-300 px-4 py-2 rounded">
                  Zurück
                </button>
                <button type="button" onClick={() => setStep(3)} className="bg-green-600 text-white px-4 py-2 rounded">
                  Weiter
                </button>
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">4) Antragszweck & Konditionen</h2>
              <label className="block mb-2">
                <span className="text-sm">Antragszweck</span>
                <input name="antragszweck" type="text" className="border p-2 w-full" placeholder="Hauskauf, Auto, Möbel..." />
              </label>
              <label className="block mb-2">
                <span className="text-sm">Kreditbetrag (TEUR)</span>
                <input name="kreditbetragTEUR" type="number" step="0.01" className="border p-2 w-full" />
              </label>
              <label className="block mb-2">
                <span className="text-sm">Eigenmittel (TEUR)</span>
                <input name="ekTEUR" type="number" step="0.01" className="border p-2 w-full" />
              </label>
              <div className="flex justify-between mt-3">
                <button type="button" onClick={() => setStep(2)} className="bg-gray-300 px-4 py-2 rounded">
                  Zurück
                </button>
                <button type="button" onClick={() => setStep(4)} className="bg-green-600 text-white px-4 py-2 rounded">
                  Weiter
                </button>
              </div>
            </section>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">5) Haushalt & KSV</h2>
              <label className="block mb-2">
                <span className="text-sm">Haushaltsrechnung (HHR)</span>
                <input name="hh" type="text" className="border p-2 w-full" />
              </label>
              <label className="block mb-2">
                <span className="text-sm">CRIF vorhanden?</span>
                <select name="crif" className="border p-2 w-full">
                  <option value="nein">nein</option>
                  <option value="ja">ja</option>
                </select>
              </label>
              <label className="block mb-2">
                <span className="text-sm">KSV-Einträge</span>
                <input name="ksvCount" type="number" className="border p-2 w-full" />
              </label>
              <div className="flex justify-between mt-3">
                <button type="button" onClick={() => setStep(3)} className="bg-gray-300 px-4 py-2 rounded">
                  Zurück
                </button>
                <button type="button" onClick={() => setStep(5)} className="bg-green-600 text-white px-4 py-2 rounded">
                  Weiter
                </button>
              </div>
            </section>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">6) Kennzahlen & Gründe</h2>
              <label className="block mb-2">
                <span className="text-sm">BELQ %</span>
                <input name="belq" type="number" step="0.01" className="border p-2 w-full" />
              </label>
              <label className="block mb-2">
                <span className="text-sm">DSTI %</span>
                <input name="dsti" type="number" step="0.01" className="border p-2 w-full" />
              </label>
              <label className="block mb-2">
                <span className="text-sm">Besondere Gründe</span>
                <textarea name="reasons" className="border p-2 w-full" placeholder="z. B. stabile Einkünfte, positive Kontoführung, gute Geschäftsbeziehung..."></textarea>
              </label>
              <div className="flex justify-between mt-3">
                <button type="button" onClick={() => setStep(4)} className="bg-gray-300 px-4 py-2 rounded">
                  Zurück
                </button>
                <button type="button" onClick={handleGenerate} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
                  {loading ? "Generiere..." : "Stellungnahme generieren"}
                </button>
              </div>
            </section>
          )}
        </form>

        {result && (
          <section className="bg-white p-6 rounded shadow mt-6">
            <h2 className="text-lg font-semibold mb-3">Generierte Stellungnahme</h2>
            <pre className="whitespace-pre-wrap">{result}</pre>
          </section>
        )}
      </div>
    </main>
  );
}
