import { DDO as v3DDO } from '@oceanprotocol/lib'
import { DDO as v4DDO } from '../../src/@types/DDO/DDO'
import { assert } from 'console'
import { getDDO } from '../../src/DDO/importDDO'
import { getAndConvertDDO } from '../../src/DDO/convertDDO'
//did: op: efba17455c127a885ec7830d687a8f6e64f5ba559f8506f8723c1f10f05c049c
const did1 =
  'did:op:efba17455c127a885ec7830d687a8f6e64f5ba559f8506f8723c1f10f05c049c'
const did2 = 'did:op:a2B8b3aC4207CFCCbDe4Ac7fa40214fd00A2BA71'
const did3 = 'did:op:50C48d3eE0Ed47479d3e2599FAe0076965cBD39c'
const nftAddress = 'BD39c'
const erc20Address = '50C48'
describe('Imports V3 DDO', () => {
  it('Imports 1st DDO', async () => {
    const ddo1: v3DDO = await getDDO(did1)
    console.log(ddo1)
    assert(
      ddo1.service[0].attributes.main.name ===
        '🖼  DataUnion.app - Image & Annotation Vault  📸'
    )
  })
  it('Imports 2nd DDO', async () => {
    const ddo2: v3DDO = await getDDO(did2)
    assert(
      ddo2.service[0].attributes.main.name ===
        'Product Pages of 1’044’709 Products on Amazon.com (processed data)'
    )
  })
  it('Imports 3rd DDO', async () => {
    const ddo3: v3DDO = await getDDO(did3)
    assert(
      ddo3.service[0].attributes.main.name ===
        'Posthuman: DistilBERT QA inference Algo v2'
    )
  })
})

describe('Converts V3 DDO to V4 DDO', () => {
  it('Converts 1st DDO', async () => {
    const ddo1: v4DDO = await getAndConvertDDO(did1, nftAddress, erc20Address)
    assert(
      ddo1.metadata.name === '🖼  DataUnion.app - Image & Annotation Vault  📸'
    )
    assert(ddo1.metadata.type === 'dataset')
  })
  it('Converts 2nd DDO', async () => {
    const ddo2: v4DDO = await getAndConvertDDO(did2, nftAddress, erc20Address)
    assert(
      ddo2.metadata.name ===
        'Product Pages of 1’044’709 Products on Amazon.com (processed data)'
    )
    assert(ddo2.metadata.type === 'dataset')
  })
  it('Converts 3rd DDO', async () => {
    const ddo3: v4DDO = await getAndConvertDDO(did3, nftAddress, erc20Address)
    assert(ddo3.metadata.name === 'Posthuman: DistilBERT QA inference Algo v2')
    assert(ddo3.metadata.type === 'algorithm')
  })
})
