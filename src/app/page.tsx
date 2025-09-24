"use client";

import { useState } from "react";

export default function Home() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult("");

    try {
      // alle Daten direkt aus den Inputs lesen
      const payload: any = {
        finType: (document.getElementById("finType") as HTMLSelectElement)?.value,
        borrowerCount: (document.getElementById("borrowerCount") as HTMLInputElement)?.value,
        borrowers: Array.from(document.querySelectorAll(".borrower-block")).map((block: any, i) => ({
          name: (block.querySelector(".name") as HTMLInputElement)?.value,
          family: (block.querySelector(".family") as HTMLInputElement)?.value,
          housing: (block.querySelector(".housing") as HTMLInputElement)?.value,
          address: (block.querySelector(".address") as HTMLInputElement)?.value,
          jobEmployer: (
