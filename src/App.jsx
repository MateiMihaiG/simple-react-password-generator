import { useState, useEffect } from "react";
import { Toaster, toast as hotToast } from "react-hot-toast";
import { IoIosRefresh } from "react-icons/io";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
const SIMILAR = "l1IO0";

const calculateStrength = ({ length, upper, lower, numbers, symbols }) => {
  let score = 0;
  if (upper) score++;
  if (lower) score++;
  if (numbers) score++;
  if (symbols) score++;
  if (length >= 12) score += 2;
  else if (length >= 8) score += 1;
  return score;
};

const strengthColor = (score) => {
  if (score <= 2) return "bg-red-500";
  if (score <= 4) return "bg-yellow-400";
  return "bg-green-500";
};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function Tooltip({ text }) {
  return (
    <span className="relative group ml-2">
      <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-base font-bold cursor-pointer border border-gray-300 select-none leading-none">
        ?
      </span>
      <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-max min-w-[120px] px-3 py-2 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-pre-line">
        {text}
      </span>
    </span>
  );
}

export default function App() {
  const [length, setLength] = useState(12);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentPasswords")) || [];
    } catch {
      return [];
    }
  });
  const [visibleRecents, setVisibleRecents] = useState([]);
  const [deletingRecents, setDeletingRecents] = useState([]);
  const [excludeSimilar, setExcludeSimilar] = useState(false);

  useEffect(() => {
    localStorage.setItem("recentPasswords", JSON.stringify(recent));
  }, [recent]);

  const generatePassword = async () => {
    let chars = "";
    let guaranteed = [];
    if (includeUpper) {
      chars += UPPERCASE;
      guaranteed.push(UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]);
    }
    if (includeLower) {
      chars += LOWERCASE;
      guaranteed.push(LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]);
    }
    if (includeNumbers) {
      chars += NUMBERS;
      guaranteed.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
    }
    if (includeSymbols) {
      chars += SYMBOLS;
      guaranteed.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    }

    // Exclude similar characters if option is checked
    if (excludeSimilar) {
      chars = chars.split("").filter((c) => !SIMILAR.includes(c)).join("");
      guaranteed = guaranteed.filter((c) => !SIMILAR.includes(c));
      if (guaranteed.length < (includeUpper + includeLower + includeNumbers + includeSymbols)) {
        if (includeUpper) guaranteed.push([...UPPERCASE].filter(c => !SIMILAR.includes(c))[0]);
        if (includeLower) guaranteed.push([...LOWERCASE].filter(c => !SIMILAR.includes(c))[0]);
        if (includeNumbers) guaranteed.push([...NUMBERS].filter(c => !SIMILAR.includes(c))[0]);
        if (includeSymbols) guaranteed.push([...SYMBOLS].filter(c => !SIMILAR.includes(c))[0]);
      }
    }

    if (!chars) {
      hotToast.error("Select at least one option!");
      return;
    }

    let pwdArr = guaranteed;
    for (let i = guaranteed.length; i < length; i++) {
      pwdArr.push(chars.charAt(Math.floor(Math.random() * chars.length)));
    }
    const pwd = shuffle(pwdArr).join("");
    setPassword(pwd);
    setCopied(false);

    let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      timezone = data.timezone || timezone;
    } catch {}

    const now = new Date();
    const recentObj = {
      password: pwd,
      timezone,
      date: now.toISOString(),
    };

    setRecent(r => [recentObj, ...r.filter(p => p.password !== pwd)].slice(0, 5));
  };

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    hotToast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPassword = () => {
    if (!password) return;
    const now = new Date();
    const site = window.location.hostname || "simple-react-calculator";
    const content = `Password generated at: ${now.toLocaleTimeString()} - ${now.toLocaleDateString()} from ${site}\n\nPassword: ${password}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "password.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    hotToast.success("Password downloaded!");
  };

  const score = calculateStrength({
    length,
    upper: includeUpper,
    lower: includeLower,
    numbers: includeNumbers,
    symbols: includeSymbols,
  });

  const missingTypes = [];
  if (!includeUpper) missingTypes.push("Uppercase");
  if (!includeLower) missingTypes.push("Lowercase");
  if (!includeNumbers) missingTypes.push("Numbers");
  if (!includeSymbols) missingTypes.push("Symbols");

  const getStrengthBar = (score) => {
    // 0-2: roșu, 3-4: galben, 5-6: verde
    if (score <= 2) return { color: "bg-red-500", width: "33%" };
    if (score <= 4) return { color: "bg-yellow-400", width: "66%" };
    return { color: "bg-green-500", width: "100%" };
  };

  return (
    <>
      <Toaster position="top-center" />
      <main className="min-h-screen w-full flex items-center justify-center p-2 sm:p-6 font-sans bg-gray-100">
        <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-8 max-w-md w-full shadow-lg relative transition-colors duration-500">
          <h1 className="text-3xl font-semibold mb-8 text-center text-black">
            Password Generator
          </h1>

          {/* Options */}
          <div className="space-y-4 mb-6 w-full">
            {[
              {
                label: "Uppercase",
                state: includeUpper,
                setter: setIncludeUpper,
                tooltip: "Include uppercase letters (A-Z) in your password.",
              },
              {
                label: "Lowercase",
                state: includeLower,
                setter: setIncludeLower,
                tooltip: "Include lowercase letters (a-z) in your password.",
              },
              {
                label: "Numbers",
                state: includeNumbers,
                setter: setIncludeNumbers,
                tooltip: "Include numbers (0-9) in your password.",
              },
              {
                label: "Symbols",
                state: includeSymbols,
                setter: setIncludeSymbols,
                tooltip: "Include symbols (e.g. !@#$%) in your password.",
              },
            ].map(({ label, state, setter, tooltip }) => (
              <label
                key={label}
                className="flex items-center justify-between cursor-pointer select-none text-black"
              >
                <span className="flex items-center">
                  {label}
                  <Tooltip text={tooltip} />
                </span>
                <button
                  type="button"
                  aria-pressed={state}
                  onClick={() => setter(!state)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none
                    ${state ? "bg-indigo-600" : "bg-gray-300"}
                    transition-colors duration-300`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow
                      ${state ? "translate-x-5" : "translate-x-1"}
                      transition-transform duration-300`}
                  />
                </button>
              </label>
            ))}
            <label
              className="flex items-center justify-between cursor-pointer select-none text-black"
            >
              <span className="flex items-center">
                Exclude similar
                <Tooltip text="Exclude similar characters (l, 1, I, O, 0) for easier reading." />
              </span>
              <button
                type="button"
                aria-pressed={excludeSimilar}
                onClick={() => setExcludeSimilar((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none
                  ${excludeSimilar ? "bg-indigo-600" : "bg-gray-300"}
                  transition-colors duration-300`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow
                    ${excludeSimilar ? "translate-x-5" : "translate-x-1"}
                    transition-transform duration-300`}
                />
              </button>
            </label>

            {/* Password length control */}
            <div className="mb-4">
              <label className="block font-medium mb-2 select-none text-gray-800">Password Length</label>
              <div className="flex items-center gap-4 rounded-lg px-4 py-3 shadow-inner bg-gray-100">
                <button
                  type="button"
                  aria-label="Decrease length"
                  onClick={() => setLength(l => Math.max(6, l - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-400 bg-white text-rose-500 text-xl font-bold shadow hover:bg-rose-100 hover:text-rose-700 active:scale-95 transition disabled:opacity-50"
                  disabled={length <= 6}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-xl font-bold w-12 text-center select-none text-black">{length}</span>
                <button
                  type="button"
                  aria-label="Increase length"
                  onClick={() => setLength(l => Math.min(32, l + 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-400 bg-white text-blue-500 text-xl font-bold shadow hover:bg-blue-100 hover:text-blue-700 active:scale-95 transition disabled:opacity-50"
                  disabled={length >= 32}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <input
                  type="range"
                  min="6"
                  max="32"
                  value={length}
                  onChange={(e) => setLength(+e.target.value)}
                  className="ml-6 w-40 accent-blue-500 h-2 rounded-lg appearance-none outline-none bg-gray-200"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(length - 6) / (32 - 6) * 100}%, #e5e7eb ${(length - 6) / (32 - 6) * 100}%, #e5e7eb 100%)`
                  }}
                  aria-valuenow={length}
                  aria-valuemin={6}
                  aria-valuemax={32}
                  aria-label="Password length"
                />
              </div>
            </div>
          </div>

          {password && (
            <div className="flex items-center justify-between rounded-lg p-4 mb-6 select-all font-mono text-lg relative w-full bg-gray-100 text-black">
              <span
                className={`truncate reveal-transition ${showPassword ? "opacity-100 blur-0" : "opacity-80 blur-sm"} text-black`}
              >
                {password}
              </span>
              <div className="flex space-x-3">
                {/* Regenerate button with refresh icon */}
                <button
                  onClick={() => {
                    generatePassword();
                    hotToast.success("Password regenerated!");
                  }}
                  aria-label="Regenerate password"
                  className="text-gray-700 hover:text-blue-500 transition"
                  type="button"
                  title="Regenerate password"
                >
                  {/* Heroicons Refresh */}
                  <IoIosRefresh className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-gray-700 hover:text-indigo-400 transition"
                  type="button"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.953 9.953 0 011.175-4.36M12 9a3 3 0 013 3m-3 0a3 3 0 01-3-3m10 7l-1.666-1.666M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={copyToClipboard}
                  disabled={copied}
                  aria-label="Copy password"
                  className={`px-4 py-2 rounded bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.03] active:scale-95 transition-transform text-white font-semibold ${copied ? "bg-green-500 bg-none" : ""
                    }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>

                <button
                  onClick={downloadPassword}
                  aria-label="Download password as .txt"
                  className="px-3 py-2 rounded bg-gray-200 hover:bg-blue-500 hover:text-white transition text-gray-700 font-semibold flex items-center justify-center border border-gray-300 shadow"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          <div
            className="text-m mb-2 text-rose-600 transition-all duration-300 ease-in-out"
            style={{
              opacity: missingTypes.length > 0 ? 1 : 0,
              transform: missingTypes.length > 0 ? "scale(1)" : "scale(0.95)",
              pointerEvents: missingTypes.length > 0 ? "auto" : "none",
              height: missingTypes.length > 0 ? "auto" : 0,
              marginBottom: missingTypes.length > 0 ? undefined : "-16px",
            }}
          >
            For a stronger password, consider adding:{" "}
            <span className="font-semibold">{missingTypes.join(", ")}</span>
          </div>

          <div className="mb-2 w-full">
            <div className="flex justify-between text-sm mb-1 select-none text-black">
              <span className="text-black">Password Strength</span>
              <span className="font-semibold text-black">
                {score <= 2 ? "Weak" : score <= 4 ? "Medium" : "Strong"}
              </span>
            </div>
            {/* Single progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getStrengthBar(score).color}`}
                style={{
                  width: getStrengthBar(score).width,
                }}
              />
            </div>
          </div>

          <div className="text-m mb-4 select-none text-gray-700">
            <ul className="list-disc ml-4">
              <li>Do not use the same password on multiple websites.</li>
              <li>Do not share your passwords with other people.</li>
              <li>Use long and complex passwords.</li>
            </ul>
          </div>

          <button
            onClick={() => {
              generatePassword();
              hotToast.success("Password generated!");
            }}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-semibold hover:scale-[1.03] active:scale-95 transition-transform"
          >
            Generate Password
          </button>
          {recent.length > 0 && (
            <div className="mt-6">
              <div className="font-medium mb-2 select-none text-gray-800">Recent Passwords</div>
              <ul className="space-y-1">
                {recent.slice(0, 5).map((p, i) => (
                  <li
                    key={i}
                    className={`flex items-center justify-between rounded px-3 py-1 font-mono text-xs bg-gray-100 text-black transition-opacity duration-300 ${deletingRecents.includes(i) ? "opacity-0" : "opacity-100"
                      }`}
                  >
                    <span
                      className={`truncate reveal-transition ${visibleRecents.includes(i) ? "opacity-100 blur-0" : "opacity-80 blur-sm"} select-all`}
                    >
                      {typeof p === "string" ? p : p.password}
                    </span>
                    <div className="flex flex-col items-end ml-2">
                      <div className="flex items-center space-x-1 mt-1">
                        <button
                          onClick={() =>
                            setVisibleRecents((prev) =>
                              prev.includes(i)
                                ? prev.filter((idx) => idx !== i)
                                : [...prev, i]
                            )
                          }
                          aria-label={visibleRecents.includes(i) ? "Hide password" : "Show password"}
                          className="text-gray-700 hover:text-indigo-400 transition"
                          type="button"
                        >
                          {visibleRecents.includes(i) ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.953 9.953 0 011.175-4.36M12 9a3 3 0 013 3m-3 0a3 3 0 01-3-3m10 7l-1.666-1.666M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(typeof p === "string" ? p : p.password);
                            hotToast.success("Copied!");
                          }}
                          aria-label="Copy password"
                        >
                          Copy
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-gray-200 hover:bg-blue-500 hover:text-white text-gray-700 text-xs border border-gray-300 shadow"
                          onClick={() => {
                            const site = window.location.hostname || "simple-react-calculator";
                            let content;
                            if (typeof p === "string") {
                              content = `Password generated from ${site}\n\nPassword: ${p}.`;
                            } else {
                              const date = new Date(p.date);
                              content = `Password generated at: ${date.toLocaleTimeString()} - ${date.toLocaleDateString()} from ${site}\n\nPassword: ${p.password}.`;
                            }
                            const blob = new Blob([content], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "password.txt";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            hotToast.success("Password downloaded!");
                          }}
                          aria-label="Download password"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                          </svg>
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-700 text-white text-xs"
                          onClick={() => {
                            setDeletingRecents((prev) => [...prev, i]);
                            setTimeout(() => {
                              setRecent(recent.filter((_, idx) => idx !== i));
                              setVisibleRecents((prev) => prev.filter((idx) => idx !== i));
                              setDeletingRecents((prev) => prev.filter((idx) => idx !== i));
                            }, 300);
                          }}
                          aria-label="Delete password"
                        >
                          X
                        </button>
                        {typeof p !== "string" && (
                          <span className="relative group ml-1">
                            <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer border border-gray-300 select-none leading-none">
                              ?
                            </span>
                            <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-max min-w-[120px] px-3 py-2 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-pre-line">
                              Generated at:{" "}
                              {new Intl.DateTimeFormat("en-US", {
                                dateStyle: "short",
                                timeStyle: "short",
                                timeZone: p.timezone,
                              }).format(new Date(p.date))}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </>
  );
}