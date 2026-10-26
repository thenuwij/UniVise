import React from "react";
import ProgramSearch from "./ProgramSearch";

function DegreeSelectorSection({ selectedDegreeId, setSelectedDegreeId, setSelectedDegreeObject, initialQuery }) {
  return (
    <section className="w-full">
      <ProgramSearch
        selectedId={selectedDegreeId}
        initialQuery={initialQuery}
        onSelect={(deg) => {
          setSelectedDegreeId(deg.id);
          setSelectedDegreeObject({
            ...deg,
            source: "unsw_selector",
          });
        }}
      />
    </section>
  );
}

export default React.memo(DegreeSelectorSection);
