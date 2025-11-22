"use client";

import React, { useState, useEffect } from "react";
import DropdownObj from "./DropdownObj"; // default import

const BlastForm = () => {
  const [bioproject, setBioproject] = useState("1133033");
  const [database, setDatabase] = useState("");
  const [program, setProgram] = useState("");
  const [accessionNumber, setAccessionNumber] = useState("");

  const [bioOptions, setBioOptions] = useState<string[]>([]);
  const [dbOptions, setDBOptions] = useState<string[]>([]);
  const [programOptions, setProgramOptions] = useState<string[]>([]);
  const [accessionNumberOptions, setAccessionNumberOptions] = useState<string[]>([]);

  const [result, setResult] = useState<string>("")

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
        return;
      }
      console.log("Request ID: ", rid);

      // Step 2: Polling
      // because the US government is very normal and sends you a waiting screen instead of just waiting
      let resultText = "";
      let statusReady = false;

      while (!statusReady) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // wait 5s between polls

        const pollRes = await fetch(`https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&RID=${rid}&FORMAT_TYPE=TEXT`);
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
          throw Error;
        }
      }
      //const res2 = await fetch(`https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&RID=${rid}&FORMAT_TYPE=${"HTML"}`);
      //const htmlResult : string = await res2.text();
      //console.log("Result: ", data2);

      // Step 3: Set
      setResult(resultText);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

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

      <button onClick={handleBlast}>
        Run BLAST
      </button>
    </div>
      <pre>
        {result}
      </pre>
      {/*result && (
        <div dangerouslySetInnerHTML={{ __html: result }} />
      )*/}
    </>
  );
};

export default BlastForm;
