import Sidebar from "@/components/sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <body className="min-h-screen overflow-hidden">
      <Sidebar>
        {children}
      </Sidebar>
    </body>
  );
}
