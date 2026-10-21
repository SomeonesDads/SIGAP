import { WorkspaceNavbar } from "@/components/layout/workspace-navbar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sigap-app">
      <WorkspaceNavbar />
      <main className="p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
