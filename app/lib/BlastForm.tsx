"use client";

// DO NOT IMPORT SQL IN CLIENT SIDE OBJECTS

import React, { useState, useEffect } from "react";
import DropdownObj from "./DropdownObj"; // default import
//import sql from './db' // BIG NO NO THAT WILL WASTE HOURS OF YOUR LIFE
import { saveBlastResult } from "@/app/lib/actions";

interface BlastHit {
  accession: string;
  description: string;
  score: string;
  evalue: string;
  identity: string;
}

interface BlastResult {
  rid: string | null;
  program: string | null;
  database: string | null;
  query: string | null;
  hits: BlastHit[];
  error?: string;
}

export function parseBlastOutput(text: string): BlastResult {
  console.log("parsing")
  const ridMatch = text.match(/RID:\s+(\S+)/);
  const programMatch = text.match(/^(BLAST\w+\s+[0-9.]+)/m);
  const dbMatch = text.match(/Database:\s+(.+)/);
  const queryMatch = text.match(/Query=\s+(.+)/);

  // Extract hits table
  let hits: BlastHit[] = [];
  if (text.includes("Sequences producing significant alignments:")) {
    const section = text.split("Sequences producing significant alignments:")[1];
    const lines = section.split("\n").filter(line => line.trim() !== "");
    hits = lines.map(line => {
      const parts = line.trim().split(/\s{2,}/);
      return {
        accession: parts[0] || "",
        description: parts[1] || "",
        score: parts[2] || "",
        evalue: parts[3] || "",
        identity: parts[4] || ""
      };
    });
  }

  // Detect errors
  let error: string | undefined;
  if (text.includes("Error:")) {
    const errMatch = text.match(/Error:(.+)/);
    error = errMatch ? errMatch[0].trim() : "Unknown error";
  }

  return {
    rid: ridMatch ? ridMatch[1] : null,
    program: programMatch ? programMatch[1] : null,
    database: dbMatch ? dbMatch[1].trim() : null,
    query: queryMatch ? queryMatch[1].trim() : null,
    hits,
    error
  };
}

const BlastForm = () => {
  const [bioproject, setBioproject] = useState("1133033");
  const [database, setDatabase] = useState("nt");
  const [program, setProgram] = useState("blastn");
  const [accessionNumber, setAccessionNumber] = useState("");

  const [bioOptions, setBioOptions] = useState<string[]>([]);
  const [dbOptions, setDBOptions] = useState<string[]>([]);
  const [programOptions, setProgramOptions] = useState<string[]>([]);
  const [accessionNumberOptions, setAccessionNumberOptions] = useState<string[]>([]);

  const [result, setResult] = useState<string>("")

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBioProjects = async () => {
      //try {
      //  const res = await fetch(
      //    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term=1133033[BioProject]&retmax=20&retmode=json`
      //  );
      //  const data = await res.json();
      //  const ids = data.esearchresult.idlist;
      //  setBioOptions(ids);
      //} catch (error) {
      //  console.error("Error fetching BioProjects:", error);
      //}
    };
    setBioOptions(["1133033"]);
    fetchBioProjects();
  }, []);

  useEffect(() => {
    const fetchDBOptions = async () => {
      //try {
      //  const res = await fetch(
      //    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term=1133033[BioProject]&retmax=20&retmode=json`
      //  );
      //  const data = await res.json();
      //  const ids = data.esearchresult.idlist;
      //  setBioOptions(ids);
      //} catch (error) {
      //  console.error("Error fetching BioProjects:", error);
      //}
    };
    setDBOptions(["nt", "nr", "refseq_rna"]);
    fetchDBOptions();
  }, []);

  useEffect(() => {
    const fetchProgramOptions = async () => {
      //try {
      //  const res = await fetch(
      //    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term=1133033[BioProject]&retmax=20&retmode=json`
      //  );
      //  const data = await res.json();
      //  const ids = data.esearchresult.idlist;
      //  setBioOptions(ids);
      //} catch (error) {
      //  console.error("Error fetching BioProjects:", error);
      //}
    };
    setProgramOptions(["blastn", "blastp", "blastx"]);
    fetchProgramOptions();
  }, []);

  useEffect(() => {
    const fetchAccessionNumber = async () => {
      try {
        const res = await fetch(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term=${bioproject}[BioProject]&retmax=20&retmode=json`
        );
        const data = await res.json();
        const ids = data.esearchresult.idlist;
        setAccessionNumberOptions(ids);
      } catch (error) {
        console.error("Error fetching BioProjects:", error);
      }
    };

    fetchAccessionNumber();
  }, []);

  const handleBlast = async () => {
    setLoading(true);
    try {
      // Step 1: Regex
      const res = await fetch(`https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Put&PROGRAM=${program}&DATABASE=${database}&QUERY=${accessionNumber}`);
      const html = await res.text();
      // regex stuff since the goverment is silly and outputs their entire html when you ask for an RID
      const ridMatch = html.match(/RID = ([A-Z0-9]+)/);
      const rid = ridMatch ? ridMatch[1] : null;
      //const data = "J18F6W0M016";
      if (!rid) {
        console.error("RID not found in response");
        console.log("Wonder what's here: ", html)
        return;
      }
      console.log("Request ID: ", rid);

      // Step 2: Polling
      // because the US government is very normal and sends you a waiting screen instead of just waiting
      let resultText = "";
      let statusReady = false;

      while (!statusReady) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // wait 5s between polls

        const pollRes = await fetch(`https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&RID=${rid}&FORMAT_TYPE=Text`);
        resultText = await pollRes.text();

        if (resultText.includes("Status=WAITING")) {
          console.log("Still waiting...");
        } else if (resultText.includes("Status=READY")) {
          console.log("Results ready!");
          statusReady = true;
        } else if (resultText.includes("Status=FAILED")) {
          console.error("BLAST job failed");
          return;
        } else {
          console.error("BLAST job failed harder");
          console.log("Debug Text: ", resultText)
          throw Error;
        }
      }
      //const res2 = await fetch(`https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&RID=${rid}&FORMAT_TYPE=${"HTML"}`);
      //const htmlResult : string = await res2.text();
      //console.log("Result: ", data2);

      // Step 3: Set
      setResult(resultText);
      // Step 4: Add this to the <database> compilation
      const parsed = parseBlastOutput(resultText);
      //console.log("Attempting to POST")

      //await sql`
      //INSERT INTO blast_results (rid, program, database, query, hits)
      //VALUES (${parsed.rid}, ${parsed.program}, ${parsed.database}, ${parsed.query}, ${JSON.stringify(parsed.hits)})
      //`;
      //await fetch("/lib/blast", {
      //  method: "POST",
      //  headers: { "Content-Type": "application/json" },
      //  body: JSON.stringify(parsed)
      //});
      //console.log("Finish POST")
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  // Return React Component
  return (
    <>
    <div style={{ display: "flex", gap: "1rem" }}>
      <DropdownObj
        label="BioProject ID"
        options={bioOptions}
        value={bioproject}
        onChange={setBioproject}
      />
      <DropdownObj
        label="Database"
        options={dbOptions}
        value={database}
        onChange={setDatabase}
      />
      <DropdownObj
        label="Program"
        options={programOptions}
        value={program}
        onChange={setProgram}
      />
      <DropdownObj
        label="Accession Number"
        options={accessionNumberOptions}
        value={accessionNumber}
        onChange={setAccessionNumber}
      />

      <button onClick={handleBlast} disabled={loading}>
        {loading ? "Running BLAST..." : "Run BLAST"}
      </button>

      <button
        onClick={async () => {
          const parsed = parseBlastOutput(result);
          console.log("saving");
          await saveBlastResult(parsed);
        }}
      >
        Save to DB
      </button>

    </div>
      {loading && <p>BLAST is running (it takes like a minute)</p>}
      {result && <pre>{result}</pre>}
      {/*result && (
        <div dangerouslySetInnerHTML={{ __html: result }} />
      )*/}
    </>
  );
};

export default BlastForm;
