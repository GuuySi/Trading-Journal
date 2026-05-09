import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 xl:ml-56 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
