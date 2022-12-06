import { Global } from '@emotion/react'

const Fonts = () => (
  <Global
    styles={`
        /* latin */
        @font-face {
          font-family: 'Graphik Bold';
          font-style: normal;
          font-weight: 700;
          font-display: swap;
          src: url('./fonts/Graphik-Bold.otf') format('otf'), url('./fonts/Graphik-Bold.otf') format('otf');
        }
        `}
  />
)

export default Fonts
