import React from "react";
import DegreeSelectorForRoadmap from "./DegreeSelectorForRoadmap";

function DegreeSelectorSection({ selectedDegreeId, setSelectedDegreeId, setSelectedDegreeObject }) {
  return (
    <section className="w-full mb-12">
      <DegreeSelectorForRoadmap
        selectedId={selectedDegreeId}
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
