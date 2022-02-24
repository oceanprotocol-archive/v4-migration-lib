import { DDO as v3DDO } from './ddoV3/DDO'
import { DDO as v4DDO } from '../@types/DDO/DDO'
import { getDDO } from './importDDO'

export async function convertDDO(
  did: string,
  v3DDO: v3DDO,
  nftAddress: string,
  erc20Address: string
): Promise<v4DDO> {
  const publishedDate = new Date(Date.now()).toISOString().split('.')[0] + 'Z'
  // TODO: complete with nft erc20etc

  const sample = {
    '@context': ['https://w3id.org/did/v1'],
    id: 'did:op:a09adfbc2882fdd7776935522148ce262131224345565d04b1c1859943b1f77c',
    version: '4.0.0',
    chainId: 8996,
    nftAddress: '0xBD94bb3fe3d475A870F5B23442F3C5f3E72Da689',
    metadata: {
      created: '2020-11-15T12:27:48Z',
      updated: '2021-05-17T21:58:02Z',
      description: 'Sample description',
      name: 'Sample asset',
      type: 'dataset',
      author: 'OPF',
      license: 'https://market.oceanprotocol.com/terms'
    },
    credentials: {
      allow: [],
      deny: []
    },
    nft: {
      address: '0xBD94bb3fe3d475A870F5B23442F3C5f3E72Da689',
      name: 'Sample asset',
      symbol: 'Sample asset',
      state: 0,
      tokenURI: 'https://oceanprotocol.com/nft/',
      owner: '0xA78deb2Fa79463945C247991075E2a0e98Ba7A09',
      created: '2022-02-24T11:40:26'
    },
    datatokens: [
      {
        address: '0x16881fC32c2b01aE7Aa9C3245BD3B2f6267487b8',
        name: 'Datatoken 1',
        symbol: 'DT1',
        serviceId: '0'
      }
    ],
    event: {
      tx: '0x1658de8ad55213714ca5085d11cb1be5319efb616e764621c0df6824a339c87c',
      block: 1439,
      from: '0xA78deb2Fa79463945C247991075E2a0e98Ba7A09',
      contract: '0xBD94bb3fe3d475A870F5B23442F3C5f3E72Da689',
      datetime: '2022-02-24T11:40:26'
    },
    stats: {
      orders: -1
    },
    services: [
      {
        id: '0',
        type: 'access',
        files:
          '0x0439513b04211c97623313e911e8e84e7f6a4a01953119bfa4186cdb8b9b1d34e58c235411f7703095757970babe2e94ecfa5c9c1473a681ca21a497933324a7c1102ab430c61ec7b0d038206772bed451654506382272b010670c7b1bfb41a80a53f39f25fe2154c2ba3eb1222ae5c7aa5c57b31d9958c5d51d50545868f95cbf8f4fc704142a62d01d89cc843f02ea0b7994ce90b373f51aed52f321727d768f8d',
        datatokenAddress: '0x16881fC32c2b01aE7Aa9C3245BD3B2f6267487b8',
        serviceEndpoint: 'http://172.15.0.4:8030',
        timeout: 3600,
        name: 'Download service',
        description: 'Download service'
      }
    ]
  }

  const v4DDO: v4DDO = {
    '@context': ['https://w3id.org/did/v1'],
    id: did,
    version: '4.0.0',
    chainId: v3DDO.chainId,
    nftAddress: nftAddress,
    metadata: {
      created: publishedDate,
      updated: publishedDate,
      type: v3DDO.service[0].attributes.main.type,
      name: v3DDO.service[0].attributes.main.name,
      description:
        v3DDO.service[0].attributes.additionalInformation.description,
      tags: v3DDO.service[0].attributes.additionalInformation.tags,
      links: v3DDO.service[0].attributes.additionalInformation.links,
      author: v3DDO.service[0].attributes.main.author,
      license: v3DDO.service[0].attributes.main.license,
      additionalInformation: {
        termsAndConditions:
          v3DDO.service[0].attributes.additionalInformation.termsAndConditions
      }
    },
    services: [
      {
        id: did,
        type: v3DDO.service[0].attributes.main.type,
        files: '',
        datatokenAddress: erc20Address,
        serviceEndpoint: v3DDO.service[1].serviceEndpoint,
        timeout: v3DDO.service[1].attributes.main.timeout
      }
    ]
  }

  return v4DDO
}

export async function getAndConvertDDO(
  did: string,
  nftAddress: string,
  erc20Address: string
): Promise<{ v3DDO; v4DDO }> {
  const v3DDO: v3DDO = await getDDO(did)
  console.log(v3DDO)
  const v4DDO: v4DDO = await convertDDO(did, v3DDO, nftAddress, erc20Address)

  return { v3DDO, v4DDO }
}
