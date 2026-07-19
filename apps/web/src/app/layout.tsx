import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import { antdTheme } from "@epg/design-tokens/antd-theme";
import { AuthProvider } from "@/lib/auth-context";
import { pageBackgroundStyle } from "@/lib/ui-style";
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
      <body style={pageBackgroundStyle}>
        <AntdRegistry>
          <ConfigProvider theme={antdTheme}>
            <App>
              <AuthProvider>{children}</AuthProvider>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
