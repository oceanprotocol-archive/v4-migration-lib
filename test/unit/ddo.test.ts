import { DDO as v3DDO } from '../../src/v3'
import { DDO as v4DDO } from '../../src/@types/DDO/DDO'
import { assert } from 'console'
import { getDDO } from '../../src/DDO/importDDO'
import { getAndConvertDDO } from '../../src/DDO/convertDDO'

const did1 = 'did:op:7Bce67697eD2858d0683c631DdE7Af823b7eea38'
const did2 = 'did:op:a2B8b3aC4207CFCCbDe4Ac7fa40214fd00A2BA71'
const did3 = 'did:op:50C48d3eE0Ed47479d3e2599FAe0076965cBD39c'
const nftAddress = ''
const erc20Address = ''
const metadataCacheUri = 'https://aquarius.oceanprotocol.com'

describe('Imports V3 DDO', () => {
  it('Imports 1st DDO', async () => {
    const ddo1: v3DDO = await getDDO(did1, metadataCacheUri)
    assert(
      ddo1.service[0].attributes.main.name ===
        '🖼  DataUnion.app - Image & Annotation Vault  📸'
    )
    assert(ddo1.service[1].type === 'access')
  })
  it('Imports 2nd DDO', async () => {
    const ddo2: v3DDO = await getDDO(did2, metadataCacheUri)
    assert(
      ddo2.service[0].attributes.main.name ===
        'Product Pages of 1’044’709 Products on Amazon.com (processed data)'
    )
    assert(ddo2.service[1].type === 'access')
  })
  it('Imports 3rd DDO', async () => {
    const ddo3: v3DDO = await getDDO(did3, metadataCacheUri)
    assert(
      ddo3.service[0].attributes.main.name ===
        'Posthuman: DistilBERT QA inference Algo v2'
    )
    assert(ddo3.service[1].type === 'access')
  })
})

describe('Converts V3 DDO to V4 DDO', () => {
  it('Converts 1st DDO', async () => {
    const ddo1: v4DDO = await getAndConvertDDO(
      did1,
      nftAddress,
      erc20Address,
      metadataCacheUri
    )
    assert(
      ddo1.metadata.name === '🖼  DataUnion.app - Image & Annotation Vault  📸'
    )
    assert(ddo1.metadata.type === 'dataset')
  })
  it('Converts 2nd DDO', async () => {
    const ddo2: v4DDO = await getAndConvertDDO(
      did2,
      nftAddress,
      erc20Address,
      metadataCacheUri
    )
    assert(
      ddo2.metadata.name ===
        'Product Pages of 1’044’709 Products on Amazon.com (processed data)'
    )
    assert(ddo2.metadata.type === 'dataset')
  })
  it('Converts 3rd DDO', async () => {
    const ddo3: v4DDO = await getAndConvertDDO(
      did3,
      nftAddress,
      erc20Address,
      metadataCacheUri
    )
    assert(ddo3.metadata.name === 'Posthuman: DistilBERT QA inference Algo v2')
    assert(ddo3.metadata.type === 'algorithm')
  })
})
