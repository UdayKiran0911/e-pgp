import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { antdTheme } from "@epg/design-tokens/antd-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "EPG Platform",
  description: "Enterprise Project Governance Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
