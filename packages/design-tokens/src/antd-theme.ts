import type { ThemeConfig } from 'antd';
import { color, semanticColor, radius, typography } from './index';

/**
 * The one and only Ant Design theme for the platform. Every app must wrap
 * its tree in <ConfigProvider theme={antdTheme}> and must not pass ad-hoc
 * `style`/`className` overrides that reintroduce raw colors or sizes.
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: color.primary[500],
    colorSuccess: color.success[500],
    colorWarning: color.warning[500],
    colorError: color.error[500],
    colorInfo: color.info[500],
    colorTextBase: semanticColor.textPrimary,
    colorBgBase: semanticColor.bgBase,
    borderRadius: parseInt(radius.md, 10),
    fontFamily: typography.fontFamily,
    fontSize: parseInt(typography.size.base, 10),
  },
  components: {
    Button: {
      borderRadius: parseInt(radius.md, 10),
      controlHeight: 36,
    },
    Card: {
      borderRadiusLG: parseInt(radius.lg, 10),
    },
    Input: {
      borderRadius: parseInt(radius.md, 10),
      controlHeight: 36,
    },
    Table: {
      borderRadiusLG: parseInt(radius.md, 10),
    },
  },
};
