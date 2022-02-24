import { DDO as v3DDO } from './ddoV3/DDO'
import { DDO as v4DDO } from '../@types/DDO/DDO'
import { getDDO } from './importDDO'

export const genericAsset: v4DDO = {
  '@context': ['https://w3id.org/did/v1'],
  id: 'testFakeDid',
  version: '4.0.0',
  chainId: 4,
  nftAddress: '0x0',
  metadata: {
    created: '2021-12-20T14:35:20Z',
    updated: '2021-12-20T14:35:20Z',
    name: 'dataset-name',
    type: 'dataset',
    description: 'Ocean protocol test dataset description',
    author: 'oceanprotocol-team',
    license: 'MIT',
    tags: ['white-papers'],
    additionalInformation: { 'test-key': 'test-value' },
    links: ['http://data.ceda.ac.uk/badc/ukcp09/']
  },
  services: [
    {
      id: 'testFakeId',
      type: 'access',
      description: 'Download service',
      files: '',
      datatokenAddress: '0xa15024b732A8f2146423D14209eFd074e61964F3',
      serviceEndpoint: 'https://providerv4.rinkeby.oceanprotocol.com',
      timeout: '0'
    }
  ]
}

export async function convertDDO(
  did: string,
  v3DDO: v3DDO,
  nftAddress: string,
  erc20Address: string
): Promise<v4DDO> {
  const publishedDate = new Date(Date.now()).toISOString().split('.')[0] + 'Z'
  // TODO: complete with nft erc20etc

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
  const v4DDO: v4DDO = await convertDDO(did, v3DDO, nftAddress, erc20Address)
  return { v3DDO, v4DDO }
}
