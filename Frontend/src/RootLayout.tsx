import SidebarLayout from "./components/sidebar/SidebarLayout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden">
      <SidebarLayout>{children}</SidebarLayout>
    </div>
  );
}
