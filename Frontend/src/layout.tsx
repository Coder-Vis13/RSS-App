import Sidebar from "@/components/sidebar"


//main layout wrapper
//children -> page you navigate to
//React.ReactNode is a TS type that represents anything React can render (strings, numbers, JSX elements, arrays of elements, null, undefined, or booleans)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <body className="flex h-screen">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </body>
  )
}
