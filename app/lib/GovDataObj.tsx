"use client";
import React, { useState } from 'react';
import IDListObj from './IDListObj';

interface IDResponse {
  esearchresult : IDList
};

interface IDList {
  idlist : string[]
};

const GovDataObj = () => {

  
  
  const [IDs, setIDs] = useState<IDResponse | undefined>(undefined); // IDs from a BioProject entry
  const [AN, setAN] = useState<string>(""); // Accession Numbers
  const [blast, setBlast] = useState(undefined); // Blast Data

  const handleBio = async () => {
    try {
      // Fetch IDs from BioProject
      const res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term=1133033[BioProject]&retmax=1000&retmode=json`);
      const data : IDResponse = await res.json();
      console.log('API Response:', data); // Debugging

      setIDs(data);

    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleIDs = async (loc : string) => {
    try {
      // Accession Number
      const res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=${loc}&rettype=acc`);
      const data : string = (await res.text()).replace(/(\r\n|\n|\r)/gm, "");;
      console.log('API Response 2:', data);
      setAN(data);

      // Blast Query
      //const res2 = await fetch(``);


    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  return (
    <div>
      <button onClick={() => handleBio()}>This is a button</button>
      {IDs && <IDListObj idlists={IDs.esearchresult} onSelect={handleIDs} />}
      {/*IDs && (
        <pre>{JSON.stringify(IDs, null, 2)}</pre>
      )*/}
    </div>
  );
};

export default GovDataObj;