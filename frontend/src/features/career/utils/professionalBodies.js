const PROFESSIONAL_BODY_INFO = {
  IEEE: { short: "IEEE", about: "Institute of Electrical and Electronics Engineers, the largest technical professional body for electrical, electronic and computing engineering." },
  ACM: { short: "ACM", about: "Association for Computing Machinery, the international society for computing professionals and researchers." },
  "Engineers Australia": { short: "EA", about: "The national body for engineers in Australia. It accredits engineering degrees and awards chartered status." },
  "Australian Computer Society": { short: "ACS", about: "The professional body for Australia's ICT sector. It accredits IT degrees and offers professional certification." },
  "Institution of Civil Engineers": { short: "ICE", about: "A UK-based international body for civil engineers." },
  IChemE: { short: "IChemE", about: "Institution of Chemical Engineers, the international body for chemical and process engineers." },
  IMechE: { short: "IMechE", about: "Institution of Mechanical Engineers, a UK-based international body for mechanical engineers." },
  "Engineering New Zealand": { short: "ENZ", about: "New Zealand's professional body for engineers." },
  ASBMB: { short: "ASBMB", about: "Australian Society for Biochemistry and Molecular Biology, for researchers and students in the molecular life sciences." },
  "Genetics Society of AustralAsia": { short: "GSA", about: "The society for genetics researchers and students in Australia and New Zealand." },
  IFST: { short: "IFST", about: "Institute of Food Science and Technology, an international body for food science professionals." },
  "Dietitians Australia": { short: "DA", about: "The national professional body for dietitians. It accredits dietetics programs." },
  "CPA Australia": { short: "CPA", about: "A professional accounting body that awards the CPA designation." },
  "Chartered Accountants ANZ": { short: "CA", about: "Chartered Accountants Australia and New Zealand, which awards the CA designation." },
  "Law Society of NSW": { short: "LSNSW", about: "The professional body for solicitors in New South Wales." },
  "Planning Institute of Australia": { short: "PIA", about: "The national body for urban and regional planners. It accredits planning degrees." },
  "Royal Australian Chemical Institute": { short: "RACI", about: "The professional body for chemists and chemical scientists in Australia." },
};

const initialsOf = (name) =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .map((word) => word[0])
    .join("")
    .slice(0, 4) || name.slice(0, 2).toUpperCase();

export function describeBody(name) {
  const info = PROFESSIONAL_BODY_INFO[name];
  return { short: info?.short || initialsOf(name), about: info?.about || null };
}
