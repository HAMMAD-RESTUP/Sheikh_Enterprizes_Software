import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarDays,
  CreditCard,
  Network,
  FileText,
  Settings,
  HelpCircle,
  Search,
  Bell,
  ChevronDown,
  Bolt,
} from "lucide-react";

const cn = (...c) => c.filter(Boolean).join(" ");

const ShellGlass = ({ className = "", children }) => (
  <div
    className={cn(
      "rounded-[28px] bg-white/25 border border-white/45 backdrop-blur-2xl",
      "shadow-[0_35px_90px_rgba(2,6,23,0.18)] overflow-hidden",
      className
    )}
  >
    {children}
  </div>
);

const Glass = ({ className = "", children }) => (
  <div
    className={cn(
      "rounded-2xl bg-white/55 backdrop-blur-xl border border-white/60",
      "shadow-[0_18px_55px_rgba(2,6,23,0.08)]",
      "hover:bg-white/65 transition",
      className
    )}
  >
    {children}
  </div>
);

const Badge = ({ children }) => (
  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 border border-white/70 text-[12px] font-black text-slate-700">
    {children}
  </span>
);

const NavTitle = ({ children }) => (
  <p className="px-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">
    {children}
  </p>
);

const NavItem = ({ icon, label, active }) => (
  <button
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition",
      active
        ? "bg-blue-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.25)]"
        : "text-slate-700 hover:bg-white/60"
    )}
  >
    <span className={cn("shrink-0", active ? "text-white" : "text-slate-500")}>
      {icon}
    </span>
    <span className="truncate">{label}</span>
    <span className="ml-auto text-slate-400">{active ? "" : "›"}</span>
  </button>
);

function SparkLine({ color = "stroke-emerald-500", data = [10, 25, 18, 30, 22, 38, 28] }) {
  const w = 120;
  const h = 44;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const px = (i) => (i * (w - 4)) / (data.length - 1) + 2;
  const py = (v) => {
    if (max === min) return h / 2;
    const n = (v - min) / (max - min);
    return h - (n * (h - 8) + 4);
  };
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-90">
      <path d={d} fill="none" className={cn("stroke-[3] stroke-linecap-round", color)} />
    </svg>
  );
}

function Donut() {
  return (
    <div className="relative w-[150px] h-[150px] mx-auto">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(#22c55e 0 45%, #06b6d4 45% 78%, #f59e0b 78% 100%)",
        }}
      />
      <div className="absolute inset-[18px] rounded-full bg-white/75 border border-white/70" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-3xl font-black text-slate-900">380</p>
          <p className="text-xs font-bold text-slate-500 mt-1">Total employees</p>
        </div>
      </div>
    </div>
  );
}

function HeatGrid() {
  // fake heatmap blocks (same vibe)
  const blocks = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);
  const palette = [0.0, 0.12, 0.22, 0.38, 0.62];
  return (
    <div className="grid grid-cols-7 gap-2">
      {blocks.map((i) => {
        const a = palette[i % palette.length];
        return (
          <div
            key={i}
            className="h-9 rounded-xl border border-white/70"
            style={{ background: `rgba(99,102,241,${a})` }}
          />
        );
      })}
    </div>
  );
}

function SalaryBars() {
  const bars = [22, 44, 30, 60, 40, 72, 48, 88, 56];
  return (
    <div className="h-48 flex items-end gap-2">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-7 rounded-xl bg-white/60 border border-white/70 overflow-hidden"
        >
          <div className="w-full rounded-xl bg-blue-600" style={{ height: `${h}%` }} />
        </div>
      ))}
    </div>
  );
}

export default function SmartPeopleStyleUI() {
  const [range, setRange] = useState("May 01 - May 07");

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background like screenshot */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200" />
      <div className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-white/40 blur-3xl" />
      <div className="absolute top-28 left-24 w-[420px] h-[420px] rounded-full bg-white/35 blur-3xl" />
      <div className="absolute bottom-0 right-1/3 w-[520px] h-[520px] rounded-full bg-white/25 blur-3xl" />

      <div className="relative mx-auto max-w-[1280px] px-4 py-10">
        <ShellGlass>
          <div className="flex min-h-[760px]">
            {/* Sidebar */}
            <aside className="w-[280px] bg-white/35 border-r border-white/50 backdrop-blur-2xl p-5">
              {/* Brand */}
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white grid place-items-center font-black">
                  S
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-900 leading-none">
                    SmartPeople
                  </p>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">HR Suite</p>
                </div>
                <button className="w-8 h-8 rounded-xl bg-white/60 border border-white/70 grid place-items-center text-slate-700 font-black">
                  ‹
                </button>
              </div>

              <div className="mt-4 space-y-5">
                <div>
                  <NavTitle>General</NavTitle>
                  <div className="mt-2 space-y-2">
                    <NavItem
                      active
                      icon={<LayoutDashboard className="w-5 h-5" />}
                      label="Dashboard"
                    />
                    <NavItem
                      icon={<ClipboardList className="w-5 h-5" />}
                      label="Notice Board"
                    />
                  </div>
                </div>

                <div>
                  <NavTitle>Essentials</NavTitle>
                  <div className="mt-2 space-y-2">
                    <NavItem icon={<Users className="w-5 h-5" />} label="Employee" />
                    <NavItem
                      icon={<CalendarDays className="w-5 h-5" />}
                      label="Leave"
                    />
                    <NavItem
                      icon={<CreditCard className="w-5 h-5" />}
                      label="Payroll"
                    />
                    <NavItem icon={<Network className="w-5 h-5" />} label="Organogram" />
                    <NavItem icon={<FileText className="w-5 h-5" />} label="Official letter" />
                  </div>
                </div>

                <div>
                  <NavTitle>Support</NavTitle>
                  <div className="mt-2 space-y-2">
                    <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" />
                    <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Help" />
                  </div>
                </div>
              </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-6">
              {/* Topbar */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-900">Dashboard</p>
                  <p className="text-xs font-bold text-slate-500">
                    SmartPeople • Admin Dashboard
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Glass className="px-4 py-2 flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                      className="bg-transparent outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-500 w-56"
                      placeholder="Search..."
                    />
                  </Glass>

                  <button className="w-11 h-11 rounded-2xl bg-white/55 border border-white/60 grid place-items-center hover:bg-white/70 transition">
                    <Bell className="w-5 h-5 text-slate-600" />
                  </button>

                  <button className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/55 border border-white/60 hover:bg-white/70 transition">
                    <div className="w-9 h-9 rounded-xl bg-slate-900/10 border border-white/70" />
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-black text-slate-900 leading-none">Admin</p>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">Online</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Header + Quick Link */}
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
                </div>
                <Badge>
                  <Bolt className="w-4 h-4 text-blue-600" />
                  Quick Link
                </Badge>
              </div>

              {/* TOP 3 CARDS */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Glass className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-black text-slate-500">Total Employee</p>
                      <p className="text-5xl font-black text-slate-900 mt-2">380</p>
                      <p className="mt-2 text-[12px] font-black text-emerald-600">
                        ↑ 21% <span className="text-slate-500 font-bold">From last year</span>
                      </p>
                    </div>
                    <SparkLine color="stroke-emerald-500" />
                  </div>
                </Glass>

                <Glass className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-black text-slate-500">In Leave (Today)</p>
                      <p className="text-5xl font-black text-slate-900 mt-2">17</p>
                      <p className="mt-2 text-[12px] font-black text-rose-600">
                        ↓ 16% <span className="text-slate-500 font-bold">From last day</span>
                      </p>
                    </div>
                    <SparkLine color="stroke-amber-500" data={[18, 12, 20, 14, 22, 16, 19]} />
                  </div>
                </Glass>

                <Glass className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-black text-slate-500">Today's Present</p>
                      <p className="text-5xl font-black text-slate-900 mt-2">363</p>
                      <p className="mt-2 text-[12px] font-black text-rose-600">
                        ↓ 04% <span className="text-slate-500 font-bold">From last day</span>
                      </p>
                    </div>
                    <SparkLine color="stroke-sky-500" data={[12, 16, 14, 18, 16, 20, 19]} />
                  </div>
                </Glass>
              </div>

              {/* Small cards row */}
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  ["In Provision", "26", "↑ 21%", "text-emerald-600"],
                  ["End Provision (Jul)", "10", "↑ 21%", "text-emerald-600"],
                  ["In Leave (Yesterday)", "12", "↓ 16%", "text-rose-600"],
                  ["In Leave (Tomorrow)", "15", "↓ 16%", "text-rose-600"],
                  ["Today's Absent", "02", "↓ 04%", "text-rose-600"],
                  ["Today's Late", "27", "↑ 04%", "text-emerald-600"],
                ].map(([t, v, d, col], i) => (
                  <Glass key={i} className="p-4">
                    <p className="text-[12px] font-black text-slate-500">{t}</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">{v}</p>
                    <p className={cn("mt-2 text-[11px] font-black", col)}>
                      {d} <span className="text-slate-500 font-bold">From last day</span>
                    </p>
                  </Glass>
                ))}
              </div>

              {/* Bottom section */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Check in heat */}
                <Glass className="lg:col-span-7 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-slate-900">Check in employee</p>
                    <div className="text-xs font-bold text-slate-500">April 2023</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {["May 01 - May 07", "08-15", "16-23", "24-01"].map((x) => (
                      <button
                        key={x}
                        onClick={() => setRange(x)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-black border",
                          range === x
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white/50 text-slate-700 border-white/70 hover:bg-white/70"
                        )}
                      >
                        {x}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5">
                    <HeatGrid />
                  </div>
                </Glass>

                {/* Salary */}
                <Glass className="lg:col-span-3 p-5">
                  <p className="text-sm font-black text-slate-900">Salary</p>
                  <div className="mt-4">
                    <SalaryBars />
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-500">Monthly distribution</p>
                </Glass>

                {/* Shift donut */}
                <Glass className="lg:col-span-2 p-5">
                  <p className="text-sm font-black text-slate-900">Shift</p>
                  <div className="mt-4">
                    <Donut />
                  </div>

                  <div className="mt-4 space-y-2 text-xs font-bold text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" /> Day Shift
                      </span>
                      <span>171</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-cyan-500" /> Night Shift
                      </span>
                      <span>133</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500" /> Custom Shift
                      </span>
                      <span>76</span>
                    </div>
                  </div>
                </Glass>
              </div>
            </main>
          </div>
        </ShellGlass>
      </div>
    </div>
  );
}