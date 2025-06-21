// app/page.tsx

import { Button } from "./components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Digestly 🚀</h1>
      <p className="mb-6 text-lg text-muted-foreground">
        Next.js + Supabase + shadcn/ui + Husky + TailwindCSS
      </p>
      <Button>Try shadcn/ui Button</Button>
    </main>
  );
}
