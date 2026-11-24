import { Suspense } from "react";
import { TbCheck } from "react-icons/tb";
import { Signup } from "@/components/Auth/Signup/Signup";

const BENEFITS = [
  "Leads, deals and outreach in one place, with AI drafting the emails",
  "A website chatbot that answers from your own docs and hands off to your team",
  "People, payroll and projects for the whole company, behind real permissions",
];

/** Two columns from 1024px: the form, and a quiet panel saying what you get (D11). */
export default function SignupPage() {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Suspense>
            <Signup />
          </Suspense>
        </div>
      </div>
      <aside className="hidden flex-col justify-center border-l border-border bg-muted/40 p-12 lg:flex">
        <div className="mx-auto max-w-md">
          <p className="text-sm font-medium text-primary">Rhinon</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Run your client business from one workspace</h2>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((b) => (
              <li key={b} className="flex gap-3 text-sm leading-6 text-foreground/80">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <TbCheck size={11} strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
