import type { Metadata } from "next";
import PortalFrame from "@/components/PortalFrame";
import "./globals.css";

export const metadata: Metadata = {
 title: "Portal do Professor",
 description: "Acompanhamento pedagógico do Ensino Fundamental I",
};

export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){
 return <html lang="pt-BR"><body><PortalFrame>{children}</PortalFrame></body></html>;
}
