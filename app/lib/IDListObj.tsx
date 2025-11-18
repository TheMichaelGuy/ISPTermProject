import React from 'react'

// parameter that makes a list
interface IDList {
  idlist : string[]
}

// Data type specifically for object itself
interface IDListList {
  idlists : IDList
  onSelect: (loc: string) => void;
}

const IDListObj: React.FC<IDListList> = ({ idlists, onSelect }) => {
  return (
    <ul>
      {idlists.idlist.map((loc, index) => (
        <li key={index} onClick={() => onSelect(loc)}>
          {loc}
        </li>
      ))}
    </ul>
  )
}

export default IDListObj;