import { FabricTheme } from '@centrifuge/fabric'
import {} from 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme extends FabricTheme {
    sizes: FabricTheme['sizes'] & {
      containerHeader: string
      containerNarrow: string
      headerHeight: number[]
    }
    typography: FabricTheme['typography'] & {
      tag: ThemeTypography['heading1']
      menuAnchor: {
        fontSize: number
        fontWeight: number
        color: string
      }
    }
  }
}