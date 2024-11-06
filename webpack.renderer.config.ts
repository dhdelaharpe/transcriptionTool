import type { Configuration } from 'webpack';
import path from 'path';
import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
// Remove this part as CSS rules are already defined in webpack.rules.ts
// rules.push({
//   test: /\.css$/,
//   use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
// });
export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias:{
      '@':path.resolve(__dirname,'src'),
    },
    fallback:{
      path: require.resolve('path-browserify'),
      fs:false,
    }
  },
};
