import { DDO as v3DDO } from '@oceanprotocol/lib'
import { DDO as v4DDO } from '../../src/@types/DDO/DDO'
import { assert } from 'console'
import getDDO from '../../src/DDO/importDDO'
import convertDDO from '../../src/DDO/convertDDO'

const did1 = 'did:op:7Bce67697eD2858d0683c631DdE7Af823b7eea38'
const did2 = 'did:op:a2B8b3aC4207CFCCbDe4Ac7fa40214fd00A2BA71'

describe('Imports V3 DDO', () => {
  it('Imports DDO1', async () => {
    const ddo1: v3DDO = await getDDO(did1)
    assert(
      ddo1.service[0].attributes.main.name ===
        '🖼  DataUnion.app - Image & Annotation Vault  📸'
    )
  })
  it('Imports DDO1', async () => {
    const ddo2: v3DDO = await getDDO(did2)
    assert(
      ddo2.service[0].attributes.main.name ===
        'Product Pages of 1’044’709 Products on Amazon.com (processed data)'
    )
  })
})

describe('Converts V3 DDO to V4 DDO', () => {
  it('Converts 1st DDO', async () => {
    const ddo1: v4DDO = await convertDDO(did1)
    console.log('ddo1', ddo1)
  })
  it('Converts 2nd DDO', async () => {
    const ddo2: v4DDO = await convertDDO(did2)
    console.log('ddo2', ddo2)
  })
})
