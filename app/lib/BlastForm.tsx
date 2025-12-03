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
    const maxHits = 10;

    hits = lines.slice(0, maxHits).map(line => {
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
  //const [programOptions, setProgramOptions] = useState<string[]>([]); // only blastn works on the fetched data
  const [accessionNumberOptions, setAccessionNumberOptions] = useState<string[]>([]);

  const [result, setResult] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  //const [debug, setDebug] = useState();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const fetchBioProjects = async () => {
      try {
        setBioOptions(["1133033"]);
        // Why is everything a convoluted query?!!!

        //console.log("Attempting to fetch BioProject")
        //const res = await fetch(
        //  `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=bioproject&term=virus&retmax=20&retmode=json`
        //);
        //const data = await res.json();
        ////console.log("BioProject Response: ", data);
        //
        //const ids = data.esearchresult.idlist; // list of BioProject IDs
        //console.log("We gottem: ", ids);
        //setBioOptions(ids);
      } catch (error) {
        console.error("Error fetching BioProjects:", error);
        setBioOptions(["1133033"]);
      }
    };
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

  //useEffect(() => {
  //  const fetchProgramOptions = async () => {
  //    //try {
  //    //  const res = await fetch(
  //    //    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term=1133033[BioProject]&retmax=20&retmode=json`
  //    //  );
  //    //  const data = await res.json();
  //    //  const ids = data.esearchresult.idlist;
  //    //  setBioOptions(ids);
  //    //} catch (error) {
  //    //  console.error("Error fetching BioProjects:", error);
  //    //}
  //  };
  //  setProgramOptions(["blastn", "blastp", "blastx"]);
  //  fetchProgramOptions();
  //}, []);
  const fetchAccessionNumber = async () => {
        try {
          const res = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term=${bioproject}[BioProject]&retmax=20&retmode=json`
          );
          //console.log("got something")
          const data = await res.json();
          //console.log("data", data)
          const ids = data.esearchresult.idlist;
          //console.log("ids", ids)
          setAccessionNumberOptions(ids);
        } catch (error) {
          console.error("Error fetching BioProjects:", error);
        }
      };

  useEffect(() => {
    fetchAccessionNumber();
  }, []);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleBlast = async () => {
    setLoading(true);
    try {
      setStatus("");
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
          setStatus("BLAST Failed. Try another Accession Number");
          return;
        } else {
          console.error("BLAST job failed harder");
          console.log("Debug Text: ", resultText)
          setStatus("BLAST Failed. Try another Accession Number");
          throw Error;
        }
      }
      //const res2 = await fetch(`https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&RID=${rid}&FORMAT_TYPE=${"HTML"}`);
      //const htmlResult : string = await res2.text();
      //console.log("Result: ", data2);

      // Step 3: Set
      setResult(resultText);
      setStatus("Query Returned!");
    } catch (error) {
      console.error('Fetch error:', error);
      setStatus("BLAST Failed. Try another Accession Number");
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
        onChange={(value:string) => {
          setBioproject(value);
          console.log("Updating AN List")
          fetchAccessionNumber();
        }}
      />
      <DropdownObj
        label="Database"
        options={dbOptions}
        value={database}
        onChange={setDatabase}
      />
      {/*
      <DropdownObj
        label="Program"
        options={programOptions}
        value={program}
        onChange={setProgram}
      />
      */}
      <DropdownObj
        label="Accession Number"
        options={accessionNumberOptions}
        value={accessionNumber}
        onChange={setAccessionNumber}
      />

      <button onClick={async () => {
        if (!loading) {
          handleBlast();
        }
        }} disabled={loading}>
        {loading ? "Running BLAST..." : "Run BLAST"}
      </button>

      <button
        onClick={async () => {
          if (status == "Query Returned!") {
          setSaving(true);
          const parsed = parseBlastOutput(result);
          console.log("saving");
          await saveBlastResult(parsed);
          setSaving(false);
          setStatus("Done!");
          }
        }}
      >
        {saving ? "Saving..." : "Save to DB"}
      </button>

    </div>
      {}
      {loading && <p>BLAST is running. {elapsed}s elapsed</p>}
      {status}
      {result && <pre>{result}</pre>}
    </>
  );
};

export default BlastForm;
