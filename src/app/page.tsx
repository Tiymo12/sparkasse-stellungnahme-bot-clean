"use client";

import { useState } from "react";

type FinType = "Wohnbaufinanzierung" | "Konsumkredit" | "";

export default function Home() {
  // Step-Navigation
  const [step, setStep] = useState<number>(0);

  // Dynamische Wiederholungen (nur für Rendering, Inputs sind UNCONTROLLED)
  const [finType, setFinType] = useState<FinType>("");
  const [borrowerCount, setBorrowerCount] = useState<number>(1);
  const [ksvCount, setKsvCount] = useState<number>(0);
  const [crifHas, setCrifHas] = useState<"ja" | "nein">("nein");

  // Ausgabe
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  // Hilfen
  const kontoverhaltenOptions = [
    "äußerst positiv",
    "positiv",
    "durchwachsen",
    "häufige Überziehungen",
  ];

  // Helfer fürs FormData-Lesen
  const getStr = (fd: FormData, key: string) => (fd.get(key)?.toString() || "").trim();

  const handleGenerate = async () => {
    setLoading(true);
    setResult("");
    try {
      const form = document.getElementById("mainForm") as HTMLFormElement;
      const fd = new FormData(form);

      // Grunddaten
      const finTypeVal = getStr(fd, "finType") as FinType;

      // Borrowers
      const bCount = Number(getStr(fd, "borrowerCount") || "1");
      const borrowers = Array.from({ length: Math.max(1, Math.min(4, bCount)) }).map((_, i) => {
        const p = (k: string) => getStr(fd, `borrowers[${i}][${k}]`);
        return {
          name: p("name"),
          family: p("family"),
          currentAddress: p("currentAddress"),
          housing: p("housing"),
          jobEmployer: p("jobEmployer"),
          employedSince: p("employedSince"),
          netIncome: p("netIncome"),
          otherIncomeDesc: p("otherIncomeDesc"),
          otherIncomeAmount: p("otherIncomeAmount"),
          customerSince: p("customerSince"),
          mainBank: p("mainBank"),
          accountBehavior: p("accountBehavior"),
        };
      });

      // GlobalData (je nach Art)
      const globalData: Record<string, string> = {
        bearbeiter: getStr(fd, "bearbeiter"),
        bewilligung: getStr(fd, "bewilligung"),
      };

      if (finTypeVal === "Wohnbaufinanzierung") {
        globalData.adresse = getStr(fd, "adresse"); // Liegenschaftsadresse (Objekt)
        globalData.kaufpreisTEUR = getStr(fd, "kaufpreisTEUR");
        globalData.nebenkostenTEUR = getStr(fd, "nebenkostenTEUR");
        globalData.sanierungTEUR = getStr(fd, "sanierungTEUR");
        globalData.puTEUR = getStr(fd, "puTEUR");
        globalData.ekTEUR = getStr(fd, "ekTEUR");
        // Zinsen als Text (damit 3,25 möglich ist)
        globalData.fixzinsProzent = getStr(fd, "fixzinsProzent").replace(",", ".");
        globalData.fixzinsJahre = getStr(fd, "fixzinsJahre");
        globalData.fixzinsEnde = getStr(fd, "fixzinsEnde");
        globalData.variabelText = getStr(fd, "variabelText");
        globalData.sondertilgungErlaubt = getStr(fd, "sondertilgungErlaubt");
      } else {
        globalData.antragszweck = getStr(fd, "antragszweck");
        globalData.kreditbetragTEUR = getStr(fd, "kreditbetragTEUR");
        globalData.ekTEUR = getStr(fd, "ekTEUR");
      }

      // Risiko
      const risk = {
        hh: getStr(fd, "hh"),
        ukv: getStr(fd, "ukv"),
        crif: {
          has: getStr(fd, "crif") === "ja",
          reason: getStr(fd, "crifReason"),
        },
        forbearanceText: getStr(fd, "forbearanceText"),
      };

      // KSV
      const kCount = Number(getStr(fd, "ksvCount") || "0");
      const ksvEntries = Array.from({ length: Math.max(0, kCount) }).map((_, i) => {
        const p = (k: string) => getStr(fd, `ksv[${i}][${k}]`);
        return {
          kind: p("kind"),
          amountTEUR: p("amountTEUR"),
          firstPayment: p("firstPayment"),
          termMonths: p("termMonths"),
          borrower: p("borrower"),
        };
      });
      const ksv = { count: kCount, entries: ksvEntries };

      // Sicherheiten
      const securities = getStr(fd, "securities");

      // Scoring & Gründe
      const scoring: Record<string, string> = {
        belq: getStr(fd, "belq"),
        dsti: getStr(fd, "dsti"),
        ltv: getStr(fd, "ltv"),
        eifa: getStr(fd, "eifa"),
        reasons: getStr(fd, "reasons"),
      };
      // Ratings/KBS je KN
      for (let i = 0; i < Math.max(1, Math.min(4, bCount)); i++) {
        scoring[`rating_${i + 1}`] = getStr(fd, `rating_${i + 1}`);
        scoring[`kbs_${i + 1}`] = getStr(fd, `kbs_${i + 1}`);
      }

      const payload = {
        finType: finTypeVal,
        borrowers,
        globalData,
        risk,
        ksv,
        securities,
        scoring,
      };

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Fehler beim Generieren");
      setResult(data.text || "Kein Text erhalten.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult("Fehler: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-red-700">Sparkasse Stellungnahme-Bot</h1>
          <p className="text-gray-600">
            Automatisierte, formelle Stellungnahmen für Wohnbaufinanzierungen und Konsumkredite.
          </p>
        </header>

        <form id="mainForm" className="space-y-6">
          {/* STEP 0 */}
          {step === 0 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">1) Finanzierungsart</h2>
              <select
                name="finType"
                className="border p-2 w-full"
                defaultValue=""
                onChange={(e) => setFinType(e.currentTarget.value as FinType)}
              >
                <option value="">— bitte wählen —</option>
                <option value="Wohnbaufinanzierung">Wohnbaufinanzierung</option>
                <option value="Konsumkredit">Konsumkredit</option>
              </select>
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                  disabled={!finType}
                >
                  Weiter
                </button>
              </div>
            </section>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">2) Kreditnehmer (Anzahl)</h2>
              <label className="block mb-2">
                <span className="text-sm">Wie viele Kreditnehmer?</span>
                <input
                  name="borrowerCount"
                  type="number"
                  min={1}
                  max={4}
                  defaultValue={borrowerCount}
                  className="border p-2 w-full"
                  onChange={(e) => setBorrowerCount(Math.max(1, Math.min(4, Number(e.currentTarget.value || "1"))))}
                />
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

          {/* STEP 2 */}
          {step === 2 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">3) Person des/der Kreditnehmer(s)</h2>

              {Array.from({ length: borrowerCount }).map((_, i) => (
                <fieldset key={i} className="border rounded p-4 mb-4">
                  <legend className="font-semibold text-sky-700">Kreditnehmer {i + 1}</legend>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <label className="block">
                      <span className="text-sm">Name</span>
                      <input name={`borrowers[${i}][name]`} type="text" className="border p-2 w-full" placeholder="Vorname Nachname" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Familienstand & Kinder</span>
                      <input name={`borrowers[${i}][family]`} type="text" className="border p-2 w-full" placeholder="ledig / verheiratet, 2 Kinder (2016/2019)" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Aktuelle Adresse</span>
                      <input name={`borrowers[${i}][currentAddress]`} type="text" className="border p-2 w-full" placeholder="Musterstraße 1, 3580 Horn" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Wohnsituation</span>
                      <input name={`borrowers[${i}][housing]`} type="text" className="border p-2 w-full" placeholder="Mieter / Eigentumswohnung / Eigenes Haus" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Beruf & Arbeitgeber</span>
                      <input name={`borrowers[${i}][jobEmployer]`} type="text" className="border p-2 w-full" placeholder="Pädagogin bei Kindergarten XY" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Beschäftigt seit</span>
                      <input name={`borrowers[${i}][employedSince]`} type="date" className="border p-2 w-full" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Monatliches Nettoeinkommen (EUR)</span>
                      <input name={`borrowers[${i}][netIncome]`} inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" placeholder="z. B. 2.500,00" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Weitere Einkünfte (Art)</span>
                      <input name={`borrowers[${i}][otherIncomeDesc]`} type="text" className="border p-2 w-full" placeholder="Mieteinnahmen / Familienbeihilfe / –" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Weitere Einkünfte (EUR/Monat)</span>
                      <input name={`borrowers[${i}][otherIncomeAmount]`} inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" placeholder="z. B. 350,00" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Seit wann Kunde</span>
                      <input name={`borrowers[${i}][customerSince]`} type="date" className="border p-2 w-full" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Hauptbankverbindung</span>
                      <input name={`borrowers[${i}][mainBank]`} type="text" className="border p-2 w-full" placeholder="Sparkasse Horn / Fremdbank ..." />
                    </label>

                    <label className="block">
                      <span className="text-sm">Kontoverhalten</span>
                      <select name={`borrowers[${i}][accountBehavior]`} className="border p-2 w-full" defaultValue="">
                        <option value="">— bitte wählen —</option>
                        {kontoverhaltenOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </fieldset>
              ))}

              <div className="flex justify-between">
                <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(1)}>
                  Zurück
                </button>
                <button type="button" className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => setStep(3)}>
                  Weiter
                </button>
              </div>
            </section>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">4) Antragszweck & Konditionen</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm">Bearbeiter (Empfehlung)</span>
                  <input name="bearbeiter" type="text" className="border p-2 w-full" placeholder="Franz Kaufmann" />
                </label>

                <label className="block">
                  <span className="text-sm">Bewilligung – Grund</span>
                  <input name="bewilligung" type="text" className="border p-2 w-full" placeholder="AA grün / a.G. Sonderkondition ..." />
                </label>

                {finType === "Wohnbaufinanzierung" ? (
                  <>
                    <label className="block">
                      <span className="text-sm">Adresse der Liegenschaft (Objekt)</span>
                      <input name="adresse" type="text" className="border p-2 w-full" placeholder="Objekt-Adresse (GB/EZ optional)" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Kaufpreis (TEUR)</span>
                      <input name="kaufpreisTEUR" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Nebenkosten (TEUR)</span>
                      <input name="nebenkostenTEUR" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Sanierung (TEUR)</span>
                      <input name="sanierungTEUR" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                    </label>

                    <label className="block">
                      <span className="text-sm">PU inkl. Beglaubigung (TEUR)</span>
                      <input name="puTEUR" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Eigenmittel (TEUR)</span>
                      <input name="ekTEUR" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Fixzinssatz (%)</span>
                      <input name="fixzinsProzent" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" placeholder="z. B. 3,25" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Fixzins-Bindung (Jahre)</span>
                      <input name="fixzinsJahre" type="number" className="border p-2 w-full" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Ende der Fixzinsbindung</span>
                      <input name="fixzinsEnde" type="date" className="border p-2 w-full" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Variable Verzinsung (Text)</span>
                      <input name="variabelText" type="text" className="border p-2 w-full" placeholder="z. B. 2,25 % über 6M-Euribor" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Pönalefreie Sondertilgungen erlaubt?</span>
                      <select name="sondertilgungErlaubt" className="border p-2 w-full" defaultValue="Nein">
                        <option value="Ja">Ja</option>
                        <option value="Nein">Nein</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="block">
                      <span className="text-sm">Antragszweck</span>
                      <input name="antragszweck" type="text" className="border p-2 w-full" placeholder="Gebrauchtwagen, Möbel ..." />
                    </label>

                    <label className="block">
                      <span className="text-sm">Kreditbetrag (TEUR)</span>
                      <input name="kreditbetragTEUR" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                    </label>

                    <label className="block">
                      <span className="text-sm">Eigenmittel (TEUR)</span>
                      <input name="ekTEUR" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                    </label>
                  </>
                )}
              </div>

              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setStep(2)} className="bg-gray-300 px-4 py-2 rounded">
                  Zurück
                </button>
                <button type="button" onClick={() => setStep(4)} className="bg-green-600 text-white px-4 py-2 rounded">
                  Weiter
                </button>
              </div>
            </section>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">5) Haushalt / Auskünfte / KSV / Forbearance / Sicherheiten</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm">Ergebnis der Haushaltsrechnung (HHR)</span>
                  <input name="hh" type="text" className="border p-2 w-full" placeholder="z. B. +320 nach Finanzierung" />
                </label>

                <label className="block">
                  <span className="text-sm">UKV</span>
                  <input name="ukv" type="text" className="border p-2 w-full" placeholder="z. B. 0" />
                </label>

                <label className="block">
                  <span className="text-sm">CRIF-Einträge vorhanden?</span>
                  <select
                    name="crif"
                    className="border p-2 w-full"
                    value={crifHas}
                    onChange={(e) => setCrifHas(e.currentTarget.value as "ja" | "nein")}
                  >
                    <option value="nein">nein</option>
                    <option value="ja">ja</option>
                  </select>
                </label>

                {crifHas === "ja" && (
                  <label className="block">
                    <span className="text-sm">CRIF – Begründung</span>
                    <input name="crifReason" type="text" className="border p-2 w-full" placeholder="wesentlich weil …" />
                  </label>
                )}

                <label className="block">
                  <span className="text-sm">Anzahl KSV-Einträge</span>
                  <input
                    name="ksvCount"
                    type="number"
                    className="border p-2 w-full"
                    value={ksvCount}
                    onChange={(e) => setKsvCount(Math.max(0, Number(e.currentTarget.value || "0")))}
                  />
                </label>
              </div>

              {ksvCount > 0 &&
                Array.from({ length: ksvCount }).map((_, i) => (
                  <fieldset key={i} className="border rounded p-3 mt-4">
                    <legend className="font-semibold text-gray-700">KSV-Eintrag {i + 1}</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <label className="block">
                        <span className="text-sm">Kreditart</span>
                        <input name={`ksv[${i}][kind]`} type="text" className="border p-2 w-full" placeholder="Konsumkredit / Wohnbaufinanzierung" />
                      </label>
                      <label className="block">
                        <span className="text-sm">Kreditbetrag (TEUR)</span>
                        <input name={`ksv[${i}][amountTEUR]`} inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                      </label>
                      <label className="block">
                        <span className="text-sm">Erste Rate / Zahlung</span>
                        <input name={`ksv[${i}][firstPayment]`} type="date" className="border p-2 w-full" />
                      </label>
                      <label className="block">
                        <span className="text-sm">Laufzeit (Monate)</span>
                        <input name={`ksv[${i}][termMonths]`} type="number" className="border p-2 w-full" />
                      </label>
                      <label className="block">
                        <span className="text-sm">Kreditnehmer (zugeordnet)</span>
                        <input name={`ksv[${i}][borrower]`} type="text" className="border p-2 w-full" placeholder="Name oder 'beide'" />
                      </label>
                    </div>
                  </fieldset>
                ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <label className="block md:col-span-2">
                  <span className="text-sm">Finanzielle Schwierigkeiten / Forbearance</span>
                  <textarea name="forbearanceText" className="border p-2 w-full min-h-[90px]" placeholder="Ja/Nein + Begründung"></textarea>
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm">Sicherheiten (einzelne Punkte)</span>
                  <textarea
                    name="securities"
                    className="border p-2 w-full min-h-[90px]"
                    placeholder={`z. B.:\n-) stille Gehaltsverpfändung\n-) sEr- & Ablebensversicherung …\n-) eingetragenes Höchstpfandrecht …`}
                  ></textarea>
                </label>
              </div>

              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setStep(3)} className="bg-gray-300 px-4 py-2 rounded">
                  Zurück
                </button>
                <button type="button" onClick={() => setStep(5)} className="bg-green-600 text-white px-4 py-2 rounded">
                  Weiter
                </button>
              </div>
            </section>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <section className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">6) Kennzahlen, Ratings & Gründe</h2>

              {Array.from({ length: borrowerCount }).map((_, i) => (
                <fieldset key={i} className="border rounded p-3 mb-3">
                  <legend className="font-semibold text-gray-700">Kreditnehmer {i + 1}</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <label className="block">
                      <span className="text-sm">Rating (vor → nach)</span>
                      <input name={`rating_${i + 1}`} type="text" className="border p-2 w-full" placeholder="z. B. A1 → A1" />
                    </label>
                    <label className="block">
                      <span className="text-sm">KBS nach Finanzierung</span>
                      <input name={`kbs_${i + 1}`} type="number" className="border p-2 w-full" />
                    </label>
                  </div>
                </fieldset>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm">BELQ in %</span>
                  <input name="belq" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                </label>
                <label className="block">
                  <span className="text-sm">DSTI in %</span>
                  <input name="dsti" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                </label>
                <label className="block">
                  <span className="text-sm">LTV in %</span>
                  <input name="ltv" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                </label>
                <label className="block">
                  <span className="text-sm">EIFA in %</span>
                  <input name="eifa" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="border p-2 w-full" />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm">Besondere Gründe (mit Beispielen)</span>
                  <textarea
                    name="reasons"
                    className="border p-2 w-full min-h-[110px]"
                    placeholder={`z. B.:\n- Leistbarkeit gegeben – positive HH-Rechnung nach Finanzierung\n- Positives Kontogebaren; Vereinbarungen eingehalten\n- Ordnungsgemäße Rückführungen in der Vergangenheit\n- Besicherungsgrad …%\n- Kein externes Negativ\n- Cross-Selling (Hauptbankwechsel, neue Versicherung)\n- weiteres Potential in der Geschäftsverbindung`}
                  ></textarea>
                </label>
              </div>

              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setStep(4)} className="bg-gray-300 px-4 py-2 rounded">
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  {loading ? "Generiere Stellungnahme…" : "Stellungnahme generieren"}
                </button>
              </div>
            </section>
          )}
        </form>

        {result && (
          <section className="bg-white p-6 rounded shadow mt-6">
            <h2 className="text-lg font-semibold mb-3">Generierte Stellungnahme</h2>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </section>
        )}
      </div>
    </main>
  );
}
