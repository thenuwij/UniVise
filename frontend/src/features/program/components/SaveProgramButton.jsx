import SaveButton from "@/shared/ui/SaveButton";

export default function SaveProgramButton({ degreeCode, degree, programName }) {
  if (!degreeCode) return null;
  const name = degree?.program_name || programName;
  return (
    <SaveButton
      itemType="degree"
      itemId={degreeCode}
      itemName={name}
      itemData={{ degree_code: degreeCode, program_name: name, faculty: degree?.faculty, source_url: degree?.source_url }}
      className="h-11! w-11! border-white/35! text-white! bg-transparent! hover:bg-white/10!"
    />
  );
}
