import { Global } from '@emotion/react'

const Fonts = () => (
  <Global
    styles={`
        /* latin */
        @font-face {
          font-family: 'Graphik';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('./fonts/GraphikRegular.otf') format('otf'), url('./fonts/GraphikRegular.otf') format('otf');
        }

        @font-face {
          font-family: 'Graphik Medium';
          font-style: normal;
          font-weight: 500;
          font-display: swap;
          src: url('./fonts/GraphikMedium.otf') format('otf'), url('./fonts/GraphikMedium.otf') format('otf');
        }
        `}
  />
)

export default Fonts
