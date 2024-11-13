import { Theme } from '@aws-amplify/ui-react';

// 커스텀 테마 정의
export const myTheme: Theme = {
  name: 'my-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          default: '#0078FF',
        },
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: { value: '{colors.brand.primary.default}' },
          color: { value: '#ffffff' },
        },
        link: {
          color: { value: 'grey' },
        },
      },
      tabs: {
        item: {
          _focus: {
            color: { value: '{colors.brand.primary.default}' },
            borderColor: { value: '{colors.brand.primary.default}' },
          },
          _active: {
            color: { value: '{colors.brand.primary.default}' },
            borderColor: { value: '{colors.brand.primary.default}' },
          },
        },
      },
    },
  },
};
