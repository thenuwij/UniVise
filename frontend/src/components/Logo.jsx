import logo from "../assets/logo.svg";

export default function Logo() {
  return (
    <div className="flex items-center">
      <img src={logo} alt="Univise Logo" className="mt-3" />
      <span className="self-center whitespace-nowrap text-5xl font-semibold dark:text-sky-950">
        Univise
      </span>
    </div>
  );
}
