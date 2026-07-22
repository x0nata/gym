export function Mark() {
  return (
    <span className="relative grid h-8 w-8 place-items-center rounded-[7px]" style={{ background: "var(--color-energy)" }}>
      <span
        style={{ fontFamily: `var(--font-sans)`, color: "#07120f", fontWeight: 800 }}
        className="text-base leading-none"
      >
        K
      </span>
    </span>
  );
}