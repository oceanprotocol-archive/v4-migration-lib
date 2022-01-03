import { DDO } from '@oceanprotocol/lib'
import { assert } from 'console'
import getDDO from '../../src/DDO/importDDO'

describe('Imports V3 DDO', () => {
  const did1 = 'did:op:7Bce67697eD2858d0683c631DdE7Af823b7eea38'
  const did2 = 'did:op:a2B8b3aC4207CFCCbDe4Ac7fa40214fd00A2BA71'

  it('Imports DDO1', async () => {
    const ddo1: DDO = await getDDO(did1)
    assert(
      ddo1.service[0].attributes.main.name ===
        '🖼  DataUnion.app - Image & Annotation Vault  📸'
    )
  })
  it('Imports DDO1', async () => {
    const ddo2: DDO = await getDDO(did2)
    assert(
      ddo2.service[0].attributes.main.name ===
        'Product Pages of 1’044’709 Products on Amazon.com (processed data)'
    )
  })
})
