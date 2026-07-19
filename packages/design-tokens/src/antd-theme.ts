import type { ThemeConfig } from 'antd';
import { color, semanticColor, radius, typography } from './index';

/**
 * The one and only Ant Design theme for the platform ("Glass Gradient" —
 * violet/cyan accent, frosted-glass surfaces, rounded-xl/2xl geometry).
 * Every app must wrap its tree in <ConfigProvider theme={antdTheme}> and
 * must not pass ad-hoc `style`/`className` overrides that reintroduce raw
 * colors or sizes.
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
    colorLink: color.primary[500],
    colorLinkHover: color.primary[400],
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
      // "Section" shape: same rounded-md + compact body padding everywhere
      // a Card appears (dashboard sections, modals sit on top of it).
      borderRadiusLG: parseInt(radius.md, 10),
      bodyPadding: 16,
    },
    Input: {
      borderRadius: parseInt(radius.md, 10),
      controlHeight: 36,
    },
    Table: {
      borderRadiusLG: parseInt(radius.md, 10),
    },
    Tabs: {
      inkBarColor: color.primary[500],
      itemSelectedColor: color.primary[600],
      itemHoverColor: color.primary[500],
    },
    Tag: {
      borderRadiusSM: parseInt(radius.full, 10),
    },
    Modal: {
      borderRadiusLG: parseInt(radius.md, 10),
    },
    Layout: {
      headerHeight: 52,
      headerPadding: '0 20px',
      headerBg: 'transparent',
      bodyBg: 'transparent',
      siderBg: 'transparent',
    },
  },
};
